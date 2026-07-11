import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permissions.js'
import { ChatMessageSchema } from '@clm/types'
import { prisma } from '../lib/prisma.js'
import { queueClassifyDocument } from '../lib/queue.js'
import { indexContract } from '../lib/elasticsearch.js'
import { assertCostCapNotExceeded, recordCost, estimateCostUsd, CostCapExceededError } from '../lib/costCap.js'
import { searchClauses } from '../lib/embeddings.js'
import { qaAgent, draftingAgent, playbookComplianceAgent } from '../mastra/index.js'
import { verifyInputSafety, verifyResponseSafety } from '../lib/safety.js'

const AssistSchema = z.object({
  selectedText: z.string().min(1),
  action: z.enum(['rewrite', 'simplify', 'expand', 'check_compliance', 'suggest_alternative', 'fix_layout', 'rewrite_document']),
  contractType: z.string().optional().default('general commercial'),
  governingLaw: z.string().optional().default('Delaware'),
  provider: z.string().optional(),
  modelId: z.string().optional(),
})

export async function agentRoutes(app: FastifyInstance) {
  // GET /api/v1/agent/models — list supported providers + models
  app.get('/models', { preHandler: requireAuth }, async (_req: unknown, reply) => {
    return reply.send({
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' }
      ]
    })
  })

  app.post('/chat', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = ChatMessageSchema.parse(req.body)
    const { sub: userId, orgId } = req.user

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(body.message, 'User Chat Prompt')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    try {
      await assertCostCapNotExceeded(orgId)
    } catch (e) {
      if (e instanceof CostCapExceededError) {
        return reply.status(429).send({
          error:  'cost_cap_exceeded',
          detail: 'Daily AI spend cap reached for this organization. Contact your admin to raise the cap or wait for the daily reset (UTC midnight).',
          usedUsd: Number(e.usedUsd.toFixed(4)),
          capUsd:  Number(e.capUsd.toFixed(2)),
        })
      }
      throw e
    }

    // Retrieve contract context if available
    let context = ''
    if (body.contractId) {
      try {
        const matches = await searchClauses(body.message, orgId, 5, body.contractId)
        if (matches.length > 0) {
          context = matches.map((m, idx) => `Clause [${idx + 1}] (${m.clauseType}):\n${m.content}`).join('\n\n')
        }
      } catch (err) {
        app.log.warn({ err }, 'Failed to fetch search context for chat, falling back to database query')
        const dbClauses = await prisma.contractClause.findMany({
          where: { version: { contractId: body.contractId } },
          take: 5,
          select: { clauseType: true, content: true }
        })
        context = dbClauses.map(c => `[${c.clauseType}]: ${c.content}`).join('\n\n')
      }
    }

    const systemPrompt = `
      You are a highly capable contract assistant for LawOS.
      Answer the user's question accurately using only the contract context provided below.
      If the context does not contain the answer, say "I cannot find this in the documents." Do not make up facts.
      Always cite your sources (clause type, section reference) precisely.
      
      Contract Context:
      ${context || 'No contract context provided.'}
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.status(500).send({ detail: 'Gemini API key is not configured' })
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: body.message }] }],
          generationConfig: { responseMimeType: 'text/plain' }
        })
      }
    )

    if (!upstream.ok) {
      const err = await upstream.text()
      return reply.status(502).send({ detail: err || 'Gemini API stream failed' })
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const reader = upstream.body?.getReader()
    if (!reader) {
      try { reply.raw.end() } catch {}
      return
    }

    const decoder = new TextDecoder()
    let streamedChars = 0

    // Send session_id in the first frame
    const sessionId = body.sessionId || body.sessionId === '' ? body.sessionId : `session_${Date.now()}`
    reply.raw.write(`data: ${JSON.stringify({ type: 'token', delta: '', session_id: sessionId })}\n\n`)

    try {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        
        let braceCount = 0
        let inString = false
        let escapeNext = false
        let objStart = -1
        let i = 0
        
        while (i < buffer.length) {
          const char = buffer[i]
          
          if (inString) {
            if (escapeNext) {
              escapeNext = false
            } else if (char === '\\') {
              escapeNext = true
            } else if (char === '"') {
              inString = false
            }
          } else {
            if (char === '"') {
              inString = true
            } else if (char === '{') {
              if (braceCount === 0) {
                objStart = i
              }
              braceCount++
            } else if (char === '}') {
              braceCount--
              if (braceCount === 0 && objStart !== -1) {
                const objStr = buffer.slice(objStart, i + 1)
                try {
                  const parsed = JSON.parse(objStr)
                  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                  if (text) {
                    streamedChars += text.length
                    reply.raw.write(`data: ${JSON.stringify({ type: 'token', delta: text })}\n\n`)
                  }
                } catch (e) {
                  // Ignore parse errors on incomplete objects
                }
                buffer = buffer.slice(i + 1)
                i = -1
                objStart = -1
              }
            }
          }
          i++
        }
      }
    } catch (err) {
      app.log.warn({ err }, 'Gemini stream read failed')
    } finally {
      reply.raw.write('data: [DONE]\n\n')
      if (!reply.raw.writableEnded) {
        try { reply.raw.end() } catch {}
      }
      recordCost(orgId, estimateCostUsd(body.message.length + streamedChars))
        .catch(e => app.log.warn({ err: e }, '[costCap] recordCost(chat) failed'))
    }
  })

  // POST /api/v1/agent/draft — AI draft generation -> saves as ContractVersion
  app.post('/draft', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const { orgId, sub: userId } = req.user
    const body = req.body as {
      userMessage: string
      templateId?: string
      context?: Record<string, unknown>
      saveAs?: { contractId?: string; title?: string }
    }

    if (!body.userMessage?.trim()) {
      return reply.status(400).send({ detail: 'userMessage is required' })
    }

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(body.userMessage, 'User Draft Prompt')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    let templateText = ''
    let usedTemplateName = 'no template'
    if (body.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: body.templateId },
        include: { sections: { orderBy: { sortOrder: 'asc' } } }
      })
      if (template) {
        usedTemplateName = template.name
        templateText = template.sections.map(s => `Section: ${s.title}\n${s.content}`).join('\n\n')
      }
    }

    const prompt = `
      You are an expert contract drafter for LawOS.
      Draft a contract of type "${body.context?.contractType ?? 'general commercial'}" matching the request: "${body.userMessage}".
      ${templateText ? `Use the following institutional template as a base structure:\n${templateText}\n\n` : ''}
      
      Output ONLY valid HTML content containing the contract body clauses. Use standard semantic tags like <h1>, <h2>, <p>, <ul>, <li>. Do not wrap in markdown backticks or markdown code blocks (e.g. do not start with \`\`\`html). Output raw HTML text directly.
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.status(500).send({ detail: 'Gemini API key is not configured' })
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      
      if (!geminiRes.ok) {
        const err = await geminiRes.text()
        return reply.status(502).send({ detail: err || 'Gemini drafting failed' })
      }

      const data = await geminiRes.json() as any
      let html = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // Strip markdown code block wrappers if generated by the LLM
      html = html.replace(/```html/g, '').replace(/```/g, '').trim()

      // Enkrypt AI Response Safety Check
      html = await verifyResponseSafety(html, 'AI Generated Contract Draft')

      if (!html) {
        return reply.status(422).send({ error: 'DRAFT_FAILED', detail: 'Draft generation returned empty text.' })
      }

      const result: Record<string, any> = {
        html,
        usedTemplateName,
        contractType: body.context?.contractType || 'OTHER'
      }

      // Optionally save the draft as a ContractVersion
      if (body.saveAs) {
        const { contractId, title } = body.saveAs

        if (contractId) {
          const existing = await prisma.contractVersion.findFirst({
            where: { contractId },
            orderBy: { versionNumber: 'desc' },
          })
          const nextVersion = (existing?.versionNumber ?? 0) + 1

          const version = await prisma.contractVersion.create({
            data: {
              contractId,
              versionNumber: nextVersion,
              htmlContent: html,
              plainText: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
              changeNote: `AI-generated draft (${usedTemplateName})`,
              createdById: userId,
            },
          })
          result.versionId = version.id
        } else if (title) {
          const owner = await prisma.user.findFirst({ where: { orgId } })
          if (owner) {
            const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            const contract = await prisma.contract.create({
              data: {
                orgId,
                ownerId: owner.id,
                title,
                type: body.context?.contractType as string || 'OTHER',
                status: 'DRAFT',
                createdBy: userId,
                analysisStatus: plainText ? 'CLASSIFYING' : 'DONE',
                versions: {
                  create: {
                    versionNumber: 1,
                    htmlContent: html,
                    plainText,
                    changeNote: `AI-generated draft (${usedTemplateName})`,
                    createdById: userId,
                  },
                },
              },
              include: { versions: true },
            })
            result.contractId = contract.id
            indexContract(contract.id, {
              orgId,
              title:     contract.title,
              type:      contract.type,
              status:    contract.status,
              plainText,
              tags:      contract.tags,
              createdAt: contract.createdAt.toISOString(),
            }).catch(err => app.log.warn({ err }, 'ES index on draft save failed'))
            if (plainText && contract.versions[0]) {
              queueClassifyDocument({ contractId: contract.id, versionId: contract.versions[0].id, orgId })
            }
          }
        }
      }

      return reply.send(result)
    } catch (err: any) {
      app.log.error(err, 'Draft agent failure')
      return reply.status(500).send({ detail: err.message })
    }
  })

  // POST /api/v1/agent/assist-stream — streaming bubble-menu AI
  app.post('/assist-stream', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = (req.body ?? {}) as {
      selectedText?: string
      action?:       string
      contractType?: string
      governingLaw?: string
    }
    if (typeof body.selectedText !== 'string' || body.selectedText.trim().length === 0) {
      return reply.status(400).send({ detail: 'selectedText is required' })
    }

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(body.selectedText, 'User Selected Text')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    const prompt = `
      You are a contract editing assistant for LawOS.
      Action requested: "${body.action ?? 'rewrite'}"
      Contract context type: "${body.contractType ?? 'general commercial'}"
      Governing Law: "${body.governingLaw ?? 'Delaware'}"
      
      Target text:
      "${body.selectedText}"
      
      Perform the requested action on the text. Return ONLY the rewritten text (no quotes, no markdown, no chat introduction).
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.status(500).send({ detail: 'Gemini API key is not configured' })
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )

    if (!upstream.ok || !upstream.body) {
      return reply.status(502).send({ detail: 'Gemini API call failed' })
    }

    reply.raw.setHeader('Content-Type', 'application/x-ndjson')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('X-Accel-Buffering', 'no')

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    
    try {
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        
        let parts = buffer.split('\n')
        buffer = parts.pop() || ''
        
        for (const part of parts) {
          const trimmed = part.trim()
          if (!trimmed || trimmed === '[' || trimmed === ']') continue
          
          try {
            const cleanJson = trimmed.startsWith(',') ? trimmed.slice(1).trim() : trimmed
            const parsed = JSON.parse(cleanJson)
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (text) {
              // Write in NDJSON format expected by frontend BubbleAiPopover
              reply.raw.write(JSON.stringify({ type: 'delta', delta: text, text }) + '\n')
            }
          } catch {
            buffer = trimmed + buffer
          }
        }
      }
    } catch {} finally {
      reply.raw.end()
    }
    return reply
  })

  // POST /api/v1/agent/classify-clause — Paragraph category classifier
  app.post('/classify-clause', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = (req.body ?? {}) as {
      clauseText?:   string
      contractType?: string
      sectionHint?:  string
    }
    if (typeof body.clauseText !== 'string' || body.clauseText.trim().length < 15) {
      return reply.send({ category: 'skip', position: 'skip', reasoning: '' })
    }

    const prompt = `
      Classify the category of the following contract paragraph and assess its position relative to standard market practices.
      Paragraph:
      "${body.clauseText}"
      
      Output ONLY a valid JSON object matching this structure (no markdown code blocks, no backticks, no wrap):
      {
        "category": "Termination" | "Liability" | "Payment" | "Indemnity" | "Governing Law" | "General",
        "position": "market" | "aggressive" | "weak" | "off" | "skip",
        "reasoning": "brief reason for classification and position assessment",
        "keyTerm": "optional key term extracted"
      }
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.send({ category: 'General', position: 'off', reasoning: 'API Key missing' })
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      const data = await geminiRes.json() as any
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(text)
      return reply.send(parsed)
    } catch (err: any) {
      return reply.send({ category: 'General', position: 'off', reasoning: 'Failed to classify automatically' })
    }
  })

  // POST /api/v1/agent/complete — ghost-text completion
  app.post('/complete', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = (req.body ?? {}) as {
      contextBefore?: string
      contextAfter?:  string
      contractType?:  string
      maxChars?:      number
    }
    if (typeof body.contextBefore !== 'string' || body.contextBefore.length < 10) {
      return reply.send({ completion: '', reason: 'too_short' })
    }

    const prompt = `
      You are a contract drafting copilot.
      Context before cursor:
      "${body.contextBefore}"
      
      Context after cursor (for style reference):
      "${body.contextAfter || ''}"
      
      Predict the NEXT few words or next sentence to complete the clause naturally. Return ONLY the predicted text (no introductions, no markdown, no quotes). Keep it under 25 words.
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.send({ completion: '', error: 'API Key missing' })
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      const data = await geminiRes.json() as any
      const completion = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return reply.send({ completion: completion.trim() })
    } catch (err: any) {
      return reply.send({ completion: '', error: err.message })
    }
  })

  app.post('/assist', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = AssistSchema.parse(req.body)

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(body.selectedText, 'User Assist Text')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    const prompt = `
      You are a contract editing assistant.
      Action requested: "${body.action}"
      Contract context type: "${body.contractType}"
      Governing Law: "${body.governingLaw}"
      
      Target text:
      "${body.selectedText}"
      
      Perform the requested action on the text. Return ONLY the rewritten text (no quotes, no markdown, no chat introduction).
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.status(500).send({ detail: 'Gemini API key is not configured' })
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      const data = await geminiRes.json() as any
      let suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // Enkrypt AI Response Safety Check
      suggestion = await verifyResponseSafety(suggestion, 'AI Assist Suggestion')

      return reply.send({ suggestion: suggestion.trim() })
    } catch (err: any) {
      return reply.status(500).send({ detail: err.message })
    }
  })

  // POST /api/v1/agent/compare — compare clause text to playbook positions
  app.post('/compare', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const { orgId } = req.user
    const { clauseText, clauseCategoryId, contractType } = req.body as {
      clauseText: string
      clauseCategoryId: string
      contractType?: string
    }

    if (!clauseText?.trim() || !clauseCategoryId) {
      return reply.status(400).send({ detail: 'clauseText and clauseCategoryId are required' })
    }

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(clauseText, 'Playbook Compare Input')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    // Fetch playbook positions from DB
    const positions = await prisma.playbookPosition.findMany({
      where: {
        orgId,
        clauseCategoryId,
        ...(contractType ? {
          OR: [
            { contractTypes: { isEmpty: true } },
            { contractTypes: { has: contractType } },
          ],
        } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    })

    if (!positions.length) {
      return reply.status(404).send({ detail: 'No playbook positions found for this category' })
    }

    const prompt = `
      Compare the following contract clause to our institution's allowed playbook positions.
      
      Clause to evaluate:
      "${clauseText}"
      
      Institution Playbook Positions (ordered by favorability):
      ${positions.map((p, idx) => `[Position ${idx + 1}] Type: ${p.positionType}\nExpected Content: ${p.content}\nEscalation Threshold: ${p.riskThreshold}\nRules: ${JSON.stringify(p.rules)}`).join('\n\n')}
      
      Evaluate which playbook position this clause matches closest.
      Determine if it is compliant or if there is a deviation. If it deviates, describe the deviation and score the risk (0 = fully compliant, 1 = walkaway risk).
      
      Output ONLY a JSON response matching:
      {
        "status": "COMPLIANT" | "DEVIATION" | "NON_COMPLIANT",
        "matchedPositionType": "preferred" | "acceptable" | "fallback" | "walkaway",
        "deviationExplanation": "description of difference, if any",
        "riskScore": 0.35,
        "suggestedRedline": "suggested replacement text if non-compliant"
      }
    `

    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!googleKey) {
      return reply.status(500).send({ detail: 'Gemini API key is not configured' })
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      )
      const data = await geminiRes.json() as any
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(text)
      return reply.send(parsed)
    } catch (err: any) {
      return reply.status(500).send({ detail: err.message })
    }
  })
}
