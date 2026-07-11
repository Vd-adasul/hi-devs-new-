/**
 * Agent Worker — handles agentQueue jobs without Python dependency:
 *   detect-binder    : LLM binder detection (Gemini) → BINDER_DETECTED or classify-document
 *   classify-document: LLM contract type classification (Gemini) → extract-ai
 *   extract-ai       : runs local Mastra documentWorkflow (clauses + timeline + risk + graph nodes)
 *   classify-request : LLM intake classification (Gemini) → stores in request.metadata
 *   approval-summary : runs local playbook audit workflow
 *   redline-analysis : runs local redline comparison workflow
 *   draft-contract   : drafts contract locally using Gemini
 */
import { Worker } from 'bullmq'
import { redis } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'
import { queueClassifyDocument, queueExtractAi, queueSplitBinder } from '../lib/queue.js'
import type { DetectBinderJob, ClassifyDocumentJob, ExtractAiJob, ClassifyRequestJob, SplitBinderJob, RedlineAnalysisJob, ApprovalSummaryJob } from '../lib/queue.js'
import { createAuditEvent } from '../lib/audit.js'
import { AuditAction } from '@clm/types'
import { documentWorkflow, redlineWorkflow, playbookAuditWorkflow } from '../mastra/index.js'
import { indexContract } from '../lib/elasticsearch.js'

// ─── detect-binder ────────────────────────────────────────────────────────────

async function handleDetectBinder(data: DetectBinderJob): Promise<void> {
  const { contractId, versionId, orgId } = data
  console.info('[agent-worker] detect-binder start contractId=%s', contractId)

  const contractMeta = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { parentContractId: true, relationshipType: true },
  })
  if (contractMeta?.parentContractId || contractMeta?.relationshipType === 'exhibit_only') {
    console.info(
      '[agent-worker] detect-binder: skipping %s (already a split child)',
      contractId
    )
    await prisma.contract.update({
      where: { id: contractId },
      data:  { analysisStatus: 'CLASSIFYING' },
    })
    queueClassifyDocument({ contractId, versionId, orgId })
    return
  }

  const version = await prisma.contractVersion.findUnique({
    where: { id: versionId },
    select: { plainText: true },
  })
  if (!version?.plainText) {
    console.warn('[agent-worker] detect-binder: plainText not yet ready for versionId=%s', versionId)
    return
  }

  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey) {
    throw new Error('Gemini API key is not configured')
  }

  const prompt = `
    Analyze this text snippet from the beginning of a document.
    Determine if this document is a multi-document binder (i.e. it contains multiple separate agreements, schedules, or exhibits compiled into a single file) or if it is a single contract.
    
    Document Text Snippet:
    "${version.plainText.slice(0, 8000)}"
    
    Output ONLY a valid JSON response:
    {
      "isBinder": true | false,
      "confidence": float between 0.0 and 1.0,
      "documents": [
        { "title": "Mutual Non-Disclosure Agreement", "docType": "NDA", "pageHint": "~page 1" },
        { "title": "Exhibit A - Scope of Work", "docType": "SOW", "pageHint": "~page 12" }
      ]
    }
  `

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini detect-binder returned ${res.status}: ${text}`)
  }

  const dataRes = await res.json() as any
  let text = dataRes?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  text = text.replace(/```json/g, '').replace(/```/g, '').trim()
  
  const result = JSON.parse(text) as {
    isBinder: boolean; confidence: number
    documents: Array<{ title: string; docType: string; charStart?: number; pageHint?: string }>
  }

  console.info('[agent-worker] detect-binder result contractId=%s isBinder=%s confidence=%.2f',
    contractId, result.isBinder, result.confidence)

  if (result.isBinder && result.confidence >= 0.7) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { metadata: true },
    })
    const existingMeta = (contract?.metadata as Record<string, unknown>) ?? {}
    const totalPages = (existingMeta._totalPages as number) ?? 100

    const splits = docsToSplitSpecs(result.documents, totalPages)

    const metadata = {
      ...existingMeta,
      _binderDetected: true,
      _suggestedSplits: splits,
      _autoSplit: true,
    }
    await prisma.contract.update({
      where: { id: contractId },
      data: { metadata, analysisStatus: 'SPLITTING' },
    })

    const parent = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { ownerId: true },
    })
    const userId = parent?.ownerId ?? ''
    if (!userId) {
      console.error('[agent-worker] detect-binder: no ownerId for contractId=%s; skipping split', contractId)
      return
    }
    queueSplitBinder({ contractId, orgId, userId, splits })
  } else {
    await prisma.contract.update({
      where: { id: contractId },
      data: { analysisStatus: 'CLASSIFYING' },
    })
    queueClassifyDocument({ contractId, versionId, orgId })
  }
}

function docsToSplitSpecs(
  docs: Array<{ title: string; docType: string; charStart?: number; pageHint?: string }>,
  totalPages: number
): SplitBinderJob['splits'] {
  if (docs.length === 0) return []
  const evenShare = Math.max(1, Math.floor(totalPages / docs.length))

  let withPages = docs.map((doc, i) => {
    const match = doc.pageHint?.match(/\d+/)
    const rawPage = match ? parseInt(match[0], 10) : NaN
    const pageNum = Number.isFinite(rawPage) && rawPage >= 1 && rawPage <= totalPages
      ? rawPage
      : i * evenShare + 1
    return { ...doc, pageNum }
  })

  withPages.sort((a, b) => a.pageNum - b.pageNum)

  const uniqueStarts = new Set(withPages.map(w => w.pageNum))
  if (uniqueStarts.size < withPages.length && withPages.length >= 2) {
    withPages = docs.map((doc, i) => ({
      ...doc,
      pageNum: Math.min(totalPages, i * evenShare + 1),
    }))
  }

  return withPages.map((doc, i) => {
    const nextStart = i < withPages.length - 1 ? withPages[i + 1].pageNum : totalPages + 1
    const pageEnd   = Math.max(doc.pageNum, nextStart - 1)
    return {
      title:     doc.title,
      type:      doc.docType,
      pageStart: doc.pageNum,
      pageEnd,
    }
  })
}

// ─── classify-document ────────────────────────────────────────────────────────

async function handleClassifyDocument(data: ClassifyDocumentJob): Promise<void> {
  const { contractId, versionId, orgId, contractType: knownType } = data
  console.info('[agent-worker] classify-document start contractId=%s', contractId)

  const version = await prisma.contractVersion.findUnique({
    where: { id: versionId },
    select: { plainText: true },
  })
  if (!version?.plainText) {
    console.warn('[agent-worker] classify-document: plainText not yet ready for versionId=%s', versionId)
    return
  }

  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey) {
    throw new Error('Gemini API key is not configured')
  }

  const prompt = `
    Classify this document based on its text snippet.
    
    Text Snippet:
    "${version.plainText.slice(0, 5000)}"
    
    Output ONLY a valid JSON response:
    {
      "contractType": "NDA" | "MSA" | "SOW" | "DPA" | "PARTNERSHIP_AGREEMENT" | "LEASE_AGREEMENT" | "EMPLOYMENT_AGREEMENT" | "OTHER",
      "confidence": float between 0.0 and 1.0,
      "reason": "brief explanation"
    }
  `

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini classify returned ${res.status}: ${text}`)
  }

  const dataRes = await res.json() as any
  let text = dataRes?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  text = text.replace(/```json/g, '').replace(/```/g, '').trim()
  
  const result = JSON.parse(text) as { contractType: string; confidence: number; reason: string }
  const resolvedType = knownType ?? result.contractType
  
  console.info('[agent-worker] classify-document contractId=%s type=%s confidence=%.2f',
    contractId, resolvedType, result.confidence)

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      type:           resolvedType,
      analysisStatus: 'EXTRACTING',
    },
  })

  queueExtractAi({ contractId, versionId, orgId, contractType: resolvedType, triggeredBy: 'upload' })
}

// ─── extract-ai ───────────────────────────────────────────────────────────────

async function handleExtractAi(data: ExtractAiJob): Promise<void> {
  const { contractId, versionId, orgId } = data
  console.info('[agent-worker] extract-ai start contractId=%s', contractId)

  const version = await prisma.contractVersion.findUnique({
    where: { id: versionId },
    select: { plainText: true, metadata: true },
  })

  if (!version?.plainText) {
    throw new Error(`No plainText for versionId=${versionId}`)
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { matterId: true }
  })
  const matterId = contract?.matterId || `matter_ephemeral_${Date.now()}`

  const versionMeta = (version.metadata as any) ?? {}
  const pageCount = versionMeta?.extraction?.pageCount || 1

  try {
    console.info('[agent-worker] Running local Mastra documentWorkflow for contractId=%s', contractId)
    const run = await documentWorkflow.createRun()
    await run.start({
      inputData: {
        orgId,
        matterId,
        documentId: contractId,
        rawText: version.plainText,
        pageCount,
      }
    })

    await prisma.contract.update({
      where: { id: contractId },
      data: { analysisStatus: 'DONE', analysisError: null }
    })
    console.info('[agent-worker] Local extract-ai completed successfully for contractId=%s', contractId)
  } catch (err: any) {
    console.error('[agent-worker] Local extract-ai workflow execution failed:', err)
    await prisma.contract.update({
      where: { id: contractId },
      data: { analysisStatus: 'FAILED', analysisError: err.message.slice(0, 500) }
    })
    throw err
  }
}

// ─── classify-request ────────────────────────────────────────────────────────

async function handleClassifyRequest(data: ClassifyRequestJob): Promise<void> {
  const { requestId } = data
  console.info('[agent-worker] classify-request start requestId=%s', requestId)

  const request = await prisma.contractRequest.findUnique({
    where: { id: requestId },
    select: { title: true, description: true, counterpartyName: true },
  })
  if (!request) throw new Error(`Request not found: ${requestId}`)

  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey) {
    throw new Error('Gemini API key is not configured')
  }

  const prompt = `
    Classify the contract request matching the title and description.
    
    Request Title: "${request.title}"
    Description: "${request.description}"
    Counterparty: "${request.counterpartyName || 'Unknown'}"
    
    Output ONLY a valid JSON response:
    {
      "contractType": "NDA" | "MSA" | "SOW" | "SLA" | "VENDOR_AGREEMENT" | "EMPLOYMENT" | "OTHER",
      "suggestedPriority": "HIGH" | "MEDIUM" | "LOW",
      "extractedTerms": {},
      "confidence": float between 0.0 and 1.0,
      "reason": "brief explanation"
    }
  `

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini classify-request returned ${res.status}: ${text}`)
  }

  const dataRes = await res.json() as any
  let text = dataRes?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  text = text.replace(/```json/g, '').replace(/```/g, '').trim()
  
  const result = JSON.parse(text) as {
    contractType: string; suggestedPriority: string
    extractedTerms: Record<string, unknown>; confidence: number; reason: string
  }

  console.info('[agent-worker] classify-request requestId=%s type=%s confidence=%.2f',
    requestId, result.contractType, result.confidence)

  const existingMeta = (await prisma.contractRequest.findUnique({
    where: { id: requestId }, select: { metadata: true },
  }))?.metadata as Record<string, unknown> ?? {}

  const updateData: Record<string, unknown> = {
    metadata: { ...existingMeta, _aiClassification: result },
    priority: result.suggestedPriority,
  }
  if (result.confidence >= 0.75) {
    updateData.type = result.contractType
  }

  await prisma.contractRequest.update({
    where: { id: requestId },
    data:  updateData as any,
  })
}

// ─── redline-analysis ────────────────────────────────────────────────────────

async function handleRedlineAnalysis(data: RedlineAnalysisJob): Promise<void> {
  const { contractId, v1Id, v2Id, orgId, userId, contractType } = data
  console.info('[agent-worker] redline-analysis start contractId=%s v1=%s v2=%s', contractId, v1Id, v2Id)

  const v2 = await prisma.contractVersion.findUnique({ where: { id: v2Id } })

  // Trigger redlineWorkflow locally
  try {
    const run = await redlineWorkflow.createRun()
    await run.start({
      inputData: {
        diffHtml: v2?.htmlContent || '',
        contractType: contractType || 'general commercial',
        playbookPositions: []
      }
    })
  } catch (err) {
    console.error('[agent-worker] redline-analysis workflow execution failed:', err)
  }

  createAuditEvent({
    orgId,
    userId,
    action: AuditAction.REDLINE_ANALYZED,
    resourceType: 'contract',
    resourceId: contractId,
    metadata: { v1Id, v2Id },
  }).catch(() => {})

  console.info('[agent-worker] local redline-analysis completed contractId=%s', contractId)
}

// ─── approval-summary ─────────────────────────────────────────────────────────

async function handleApprovalSummary(data: ApprovalSummaryJob): Promise<void> {
  const { instanceId, contractId } = data
  console.info('[agent-worker] approval-summary start instanceId=%s contractId=%s', instanceId, contractId)

  try {
    const run = await playbookAuditWorkflow.createRun()
    await run.start({
      inputData: {
        documentId: contractId,
        playbookId: 'default'
      }
    })
  } catch (err) {
    console.error('[agent-worker] approval-summary workflow execution failed:', err)
  }

  console.info('[agent-worker] local approval-summary completed instanceId=%s', instanceId)
}

// ─── draft-contract ──────────────────────────────────────────────────────────

interface DraftContractJobData {
  contractId: string
  orgId: string
  userId: string
  requestTitle: string
  requestDescription: string
  contractType: string
  counterpartyName?: string
  estimatedValue?: number
}

async function handleDraftContract(data: DraftContractJobData): Promise<void> {
  const { contractId, orgId, userId, requestTitle, requestDescription, contractType, counterpartyName, estimatedValue } = data
  console.info('[agent-worker] draft-contract start contractId=%s type=%s', contractId, contractType)

  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!googleKey) {
    throw new Error('Gemini API key is not configured')
  }

  const prompt = `
    Draft a ${contractType} titled "${requestTitle}".
    Description / instructions: ${requestDescription || ''}
    Counterparty: ${counterpartyName || 'Unknown'}
    Estimated contract value: ${estimatedValue || 'Not specified'}
    
    Output ONLY valid HTML content. Do not wrap in markdown code blocks.
  `

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini draft-contract returned ${res.status}: ${text}`)
  }

  const dataRes = await res.json() as any
  let html = dataRes?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  html = html.replace(/```html/g, '').replace(/```/g, '').trim()

  if (!html) {
    throw new Error('Draft agent error: No HTML returned')
  }

  const latest = await prisma.contractVersion.findFirst({
    where: { contractId },
    orderBy: { versionNumber: 'desc' },
  })
  const nextVersion = (latest?.versionNumber ?? 0) + 1

  await prisma.contractVersion.create({
    data: {
      contractId,
      versionNumber: nextVersion,
      htmlContent:   html,
      plainText:     html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      mimeType:      'text/html',
      fileSize:      Buffer.byteLength(html),
      changeNote:    'AI-generated first draft',
      createdById:   userId,
    },
  })

  await prisma.contract.update({
    where: { id: contractId },
    data:  { analysisStatus: 'DONE' },
  })

  console.info('[agent-worker] draft-contract done contractId=%s', contractId)
}

export const agentWorker = new Worker(
  'agents',
  async (job) => {
    console.info('[worker:agents] → start name=%s id=%s', job.name, job.id)
    if (job.name === 'detect-binder') {
      await handleDetectBinder(job.data as DetectBinderJob)
    } else if (job.name === 'classify-document') {
      await handleClassifyDocument(job.data as ClassifyDocumentJob)
    } else if (job.name === 'extract-ai') {
      await handleExtractAi(job.data as ExtractAiJob)
    } else if (job.name === 'classify-request') {
      await handleClassifyRequest(job.data as ClassifyRequestJob)
    } else if (job.name === 'redline-analysis') {
      await handleRedlineAnalysis(job.data as RedlineAnalysisJob)
    } else if (job.name === 'approval-summary') {
      await handleApprovalSummary(job.data as ApprovalSummaryJob)
    } else if (job.name === 'draft-contract') {
      await handleDraftContract(job.data as DraftContractJobData)
    }
  },
  { connection: redis as any, concurrency: 2 }
)

agentWorker.on('completed', (job) => {
  console.info('[worker:agents] ✓ job done name=%s id=%s', job.name, job.id)
})

agentWorker.on('failed', async (job, err) => {
  console.error('[worker:agents] ✗ job failed name=%s id=%s attempt=%d/%d err=%s',
    job?.name, job?.id, job?.attemptsMade ?? 0, job?.opts?.attempts ?? 2, err.message)
  const contractId = (job?.data as { contractId?: string })?.contractId
  if (contractId && job && job.attemptsMade >= (job.opts.attempts ?? 2)) {
    await prisma.contract.update({
      where: { id: contractId },
      data: { analysisStatus: 'FAILED', analysisError: err.message.slice(0, 500) },
    }).catch(() => {})
  }
})
