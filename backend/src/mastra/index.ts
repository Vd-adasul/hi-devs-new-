import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createStep, Workflow } from '@mastra/core/workflows';
import { prisma } from '../lib/prisma.js';
import { QdrantService } from '../services/qdrant.service.js';
import { getEmbedding } from '../utils/embedding.js';
import { objectIdToUuid } from '../utils/uuid.js';
import { storeClausesTool, searchQdrantTool, verifyCitationTool } from './tools.js';
import { Neo4jService } from '../services/neo4j.service.js';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

// Ensure Google API Key is set for Mastra model gateway
if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

function padTo(vec: number[], dims: number): number[] {
  if (vec.length >= dims) return vec.slice(0, dims);
  return [...vec, ...new Array(dims - vec.length).fill(0)];
}

// 1. Document Processing Agent
export const documentProcessingAgent = new Agent({
  id: 'document-processing-agent',
  name: 'Document Processing Agent',
  instructions: `
    You are an expert legal document analyst.
    Your task is to take extracted contract text, parse it into individual clauses, and identify their categories (like Termination, Liability, Payment, Indemnification, Governing Law, etc.).
    You also extract parties, obligations, and legal events.
    Use the store-clauses tool to persist the structured clauses to PostgreSQL and index them in Qdrant Cloud.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: { storeClausesTool },
});

// 2. Timeline Agent
export const timelineAgent = new Agent({
  id: 'timeline-agent',
  name: 'Timeline Agent',
  instructions: `
    You are a legal schedule assistant.
    Your goal is to parse extracted obligations and legal events (dates, renewal notice windows, schedules) and produce a clean, structured timeline report.
    Group events chronologically by: Deadlines, Renewals, Expirations, Notice Periods, and Payment Schedules.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 3. Risk Intelligence Agent
export const riskAgent = new Agent({
  id: 'risk-agent',
  name: 'Risk Agent',
  instructions: `
    You are a legal risk analyst.
    You examine clauses and obligations, and determine their risk level (low, medium, high) based on standard contract rules (e.g. Unlimited Liability, Auto Renewal without termination, etc.).
    Provide a clear business impact analysis and reasoning for each risk identified.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 4. Legal QA Agent (Graph RAG)
export const qaAgent = new Agent({
  id: 'qa-agent',
  name: 'Legal QA Agent',
  instructions: `
    You are a highly accurate grounded QA assistant.
    Your goal is to answer lawyer questions by relying ONLY on the retrieved evidence (clauses from the document and organizational knowledge).
    If the evidence does not contain the answer, say "I cannot find this in the documents." Do not hallucinate.
    Always cite your sources (clause ID, page number, document name) precisely.
    Use search-qdrant to retrieve relevant vector context.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: { searchQdrantTool },
});

// 5. Clause Benchmarking Agent
export const benchmarkAgent = new Agent({
  id: 'benchmark-agent',
  name: 'Benchmark Agent',
  instructions: `
    You are a contract drafting benchmarking assistant.
    Your goal is to compare a contract clause against standard CUAD categories and top matched templates from our institutional library (retrieved via Qdrant).
    Identify gaps, favorable/unfavorable deviations, and suggest redlines.
    Use search-qdrant to find similar clauses.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: { searchQdrantTool },
});

// 6. Citation Verification Agent
export const citationAgent = new Agent({
  id: 'citation-agent',
  name: 'Citation Agent',
  instructions: `
    You are a legal citation checker.
    Your job is to look at any citations mentioned in legal research or answers and verify them.
    Use verify-citation to check if the statutory case law actually exists in case law records or legal databases.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: { verifyCitationTool },
});

// 7. Research Agent (IndianKanoon statutory search synthesis)
export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: `
    You are a legal research analyst for Indian law.
    Given a research query and a list of case summaries from IndianKanoon, write a structured legal research memo.
    Format:
    - Issue
    - Applicable Law
    - Key Cases with holdings
    - Analysis
    - Conclusion
    Always cite each case by full name, year, and its relevance score.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 8. Drafting Agent (docx template filling and alternative generation)
export const draftingAgent = new Agent({
  id: 'drafting-agent',
  name: 'Drafting Agent',
  instructions: `
    You are a legal drafting assistant.
    Given a clause type, context parameters, and a retrieved template, draft a legally sound contract clause.
    Provide 2 alternative options. Rate each option by favorability (e.g., pro-client, balanced, pro-counterparty).
    Output structure should be JSON.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 9. Negotiation Agent (NegMAS-inspired SAOP alternating offer generator)
export const negotiationAgent = new Agent({
  id: 'negotiation-agent',
  name: 'Negotiation Agent',
  instructions: `
    You are an automated bilateral contract negotiator inspired by NegMAS.
    Your goal is to evaluate the counterparty's latest counter-proposals against our playbook (our preferred, fallback, and red-line positions).
    Perform a ZOPA (Zone of Possible Agreement) estimation and calculate the optimal concession rate based on time pressure/deadline countdown.
    Output if we should accept, reject, or make a counter-offer with adjusted clause values.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 10. Playbook Compliance Agent (Automated compliance audits)
export const playbookComplianceAgent = new Agent({
  id: 'playbook-compliance-agent',
  name: 'Playbook Compliance Agent',
  instructions: `
    You are a playbook compliance auditor.
    Your task is to scan every clause in a contract and compare it against the corporate playbook positions.
    Identify any deviations, violations of red-lines, and suggest compliant redline edits.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});

// 11. Matter Twin Agent (Semantic auto-merge & conflict detection)
export const matterTwinAgent = new Agent({
  id: 'matter-twin-agent',
  name: 'Matter Twin Agent',
  instructions: `
    You are a living matter twin builder.
    Compare existing clauses of a matter against incoming document clauses.
    Identify new, conflicting, or superseded clauses and generate a unified merged state of active clauses.
  `,
  model: {
    providerId: 'openai-compatible',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || process.env.OPENAI_API_KEY || ''
  },
  tools: {},
});


// --- WORKFLOW STEPS ---

const extractClausesStep = createStep({
  id: 'extract-clauses-step',
  inputSchema: z.object({
    orgId: z.string(),
    matterId: z.string(),
    documentId: z.string(),
    rawText: z.string(),
    pageCount: z.number(),
  }),
  outputSchema: z.object({
    agentSummary: z.string(),
  }),
  execute: async ({ getInitData }) => {
    const triggerData = getInitData<any>();
    const { orgId, matterId, documentId, rawText, pageCount } = triggerData;

    // Resolve versionId for this contract
    const contract = await prisma.contract.findUnique({
      where: { id: documentId },
      select: { currentVersionId: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1, select: { id: true } } }
    });
    const versionId = contract?.currentVersionId || contract?.versions[0]?.id;

    if (!versionId) {
      throw new Error(`Could not find a valid version for contract: ${documentId}`);
    }

    // ✅ IDEMPOTENCY: If clauses already exist for this version, skip re-extraction
    const existingCount = await prisma.contractClause.count({ where: { versionId } });
    if (existingCount > 0) {
      console.log(`[Idempotency] ${existingCount} clauses already exist for version ${versionId}. Skipping AI extraction.`);
      return {
        agentSummary: `Loaded ${existingCount} existing clauses from database. No re-extraction needed.`,
      };
    }

    const prompt = `
      You are analyzing a legal contract for Organization ID: ${orgId}, Matter ID: ${matterId}, Document ID: ${documentId}.
      Here is the contract text:
      ---
      ${rawText}
      ---

      Analyze the text. Break it down into logical clauses.
      For each clause, identify its category (e.g. Termination, Liability, Payment, Indemnity, General, Governing Law).
      Map each clause to its page number (spread them out logically across the page count of ${pageCount} pages).
      For each clause, also assess its risk rating/level (e.g., whether it is favorable to us, unfavorable/high risk, neutral boilerplate, or unusual/non-standard).

      Output ONLY a valid JSON array of objects. Do not wrap in markdown or backticks.
      Each object in the array MUST have the following structure:
      - category: string
      - rawText: string
      - pageNumber: number
      - riskLevel: "favorable" | "unfavorable" | "neutral" | "unusual" | "high" | "medium" | "low"
    `;

    const agentRes = await documentProcessingAgent.generate(prompt);
    
    let clauses: any[] = [];
    try {
      const cleanJson = agentRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
      clauses = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse clauses JSON from agent, falling back:', e);
      clauses = [{
        category: 'General',
        rawText: rawText.substring(0, 1000) + '...',
        pageNumber: 1,
        riskLevel: 'neutral'
      }];
    }

    const qdrantService = QdrantService.getInstance();
    const points: any[] = [];

    // Delete existing clauses for this version to avoid duplicates
    await prisma.contractClause.deleteMany({ where: { versionId } });

    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      
      const createdClause = await prisma.contractClause.create({
        data: {
          versionId,
          clauseType: clause.category || 'General',
          content: clause.rawText || '',
          riskRating: clause.riskLevel || 'neutral',
          sortOrder: i,
        }
      });

      const vector = await getEmbedding(clause.rawText || '');

      points.push({
        id: objectIdToUuid(createdClause.id),
        vector: padTo(vector, 3072),
        payload: {
          org_id: orgId,
          matter_id: matterId,
          document_id: documentId,
          clause_id: createdClause.id,
          clause_type: clause.category || 'General',
          page_number: typeof clause.pageNumber === 'number' ? clause.pageNumber : 1,
          raw_text: clause.rawText || '',
        },
      });
    }

    if (points.length > 0) {
      await qdrantService.upsertPoints('legal_documents', points);
    }

    return {
      agentSummary: `Successfully extracted and indexed ${clauses.length} clauses semantically into Qdrant database.`,
    };
  },
});

const generateTimelineStep = createStep({
  id: 'generate-timeline-step',
  inputSchema: z.any(),
  outputSchema: z.object({
    obligationCount: z.number(),
  }),
  execute: async ({ getInitData }) => {
    const triggerData = getInitData<any>();
    const { orgId, matterId, documentId } = triggerData;

    const contract = await prisma.contract.findUnique({
      where: { id: documentId },
      select: { currentVersionId: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1, select: { id: true } } }
    });
    const versionId = contract?.currentVersionId || contract?.versions[0]?.id;

    if (!versionId) {
      return { obligationCount: 0 };
    }

    const clauses = await prisma.contractClause.findMany({
      where: { versionId }
    });

    if (clauses.length === 0) {
      return { obligationCount: 0 };
    }

    const clausesText = clauses.map(c => `[Clause ID ${c.id} - ${c.clauseType}]: ${c.content}`).join('\n');

    const prompt = `
      You are analyzing extracted contract clauses for Matter ID: ${matterId}, Document ID: ${documentId}.
      Here are the extracted clauses:
      ---
      ${clausesText}
      ---

      Extract all legal obligations, timelines, payment schedules, and notice windows.
      Return a JSON array of obligations containing:
      - raw_text: The obligation description (e.g., "Payment is due within 30 days of invoice date")
      - due_date: Approximate due date in YYYY-MM-DD or leave null if recurring/conditional
      - type: "payment" | "sla" | "renewal" | "compliance" | "other"
      - quote: verbatim text from clause as proof
      - severity: "high" | "medium" | "low"

      Output ONLY a valid JSON array of objects. Do not wrap in markdown or backticks.
    `;

    const agentRes = await timelineAgent.generate(prompt);
    
    let obligations: any[] = [];
    try {
      const cleanJson = agentRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
      obligations = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse timeline JSON from agent, falling back:', e);
      obligations = [{ raw_text: 'Timeline extraction complete. Review clauses.', type: 'other', severity: 'medium' }];
    }

    // Delete existing obligations for this contract to avoid duplicates
    await prisma.obligation.deleteMany({ where: { contractId: documentId } });

    const records = [];
    for (const o of obligations) {
      const created = await prisma.obligation.create({
        data: {
          orgId,
          contractId: documentId,
          type: o.type || 'other',
          description: o.raw_text,
          dueDate: o.due_date ? new Date(o.due_date) : null,
          quote: o.quote || o.raw_text,
          severity: o.severity || 'medium',
          status: 'OPEN',
        }
      });
      records.push(created);
    }

    return { obligationCount: records.length };
  },
});

const analyzeRisksStep = createStep({
  id: 'analyze-risks-step',
  inputSchema: z.any(),
  outputSchema: z.object({
    riskCount: z.number(),
  }),
  execute: async ({ getInitData }) => {
    const triggerData = getInitData<any>();
    const { orgId, matterId, documentId } = triggerData;

    const contract = await prisma.contract.findUnique({
      where: { id: documentId },
      select: { title: true, currentVersionId: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1, select: { id: true } } }
    });
    const versionId = contract?.currentVersionId || contract?.versions[0]?.id;

    if (!versionId) {
      return { riskCount: 0 };
    }

    const clauses = await prisma.contractClause.findMany({
      where: { versionId }
    });

    if (clauses.length === 0) {
      return { riskCount: 0 };
    }

    const originalTitle = contract.title || 'Contract';
    const clausesText = clauses.map(c => `[Clause ID ${c.id} - ${c.clauseType}]: ${c.content}`).join('\n');

    const prompt = `
      You are a contract risk and classification specialist.
      Analyze the extracted contract clauses below for Matter ID: ${matterId}, Document ID: ${documentId}.
      Produce the final risk, summary, and classification analysis.

      Extracted Clauses:
      ---
      ${clausesText}
      ---

      Return ONLY a valid JSON object matching this structure:
      {
        "contractType": "NDA" | "MSA" | "SOW" | "SLA" | "VENDOR_AGREEMENT" | "EMPLOYMENT" | "PARTNERSHIP" | "LICENSE" | "DATA_PROCESSING" | "ORDER_FORM" | "OTHER",
        "suggestedTitle": "concise human-readable title using party names and contract type, max 80 chars",
        "summary": "2-3 sentence plain-English summary of what this contract does, who the parties are, and key terms",
        "riskScore": float between 0.0 and 1.0 (where 1.0 is highest risk),
        "riskFactors": ["brief description of key risk factors found, e.g. Unlimited Liability, Broad Indemnification, restrictive assignment"],
        "risksList": [
          {
            "risk_level": "high" | "medium" | "low",
            "description": "brief description of the risk, e.g. Unlimited Liability",
            "explanation": "business impact and why this is a risk"
          }
        ]
      }

      Do not wrap in markdown or backticks. JSON only.
    `;

    const agentRes = await riskAgent.generate(prompt);
    
    let analysisResult: any = {};
    try {
      const cleanJson = agentRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
      analysisResult = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse risk and classification analysis JSON from agent:', e);
      analysisResult = {
        contractType: 'OTHER',
        suggestedTitle: originalTitle,
        summary: 'Review required.',
        riskScore: 0.5,
        riskFactors: ['Review required'],
        risksList: [{ risk_level: 'medium', description: 'Review required', explanation: 'Please inspect clauses manually.' }]
      };
    }

    // 1. Update the contract in Postgres
    await prisma.contract.update({
      where: { id: documentId },
      data: {
        riskScore: typeof analysisResult.riskScore === 'number' ? analysisResult.riskScore : 0,
        riskFactors: Array.isArray(analysisResult.riskFactors) ? analysisResult.riskFactors : [],
        summary: analysisResult.summary || '',
        type: analysisResult.contractType || 'OTHER',
        title: analysisResult.suggestedTitle || originalTitle,
      }
    });

    // 2. Build Knowledge Graph nodes & edges in PostgreSQL and Neo4j
    console.log('Graph: Syncing processed document context to Knowledge Graph...');
    const neo4jService = Neo4jService.getInstance();
    
    try {
      // Create Matter node
      const matter = await prisma.matter.findUnique({
        where: { id: matterId },
        select: { name: true }
      });
      await neo4jService.createMatterNode(matterId, matter?.name || 'Matter', orgId);

      // Create Document node
      await neo4jService.createDocumentNode(documentId, matterId, analysisResult.suggestedTitle || originalTitle, analysisResult.contractType || 'OTHER');

      // Create Clause nodes
      for (const clause of clauses) {
        await neo4jService.createClauseNode(
          clause.id,
          documentId,
          clause.clauseType,
          clause.content,
          clause.riskRating || 'low'
        );
      }
    } catch (graphErr) {
      console.error('Failed to sync nodes to Knowledge Graph:', graphErr);
    }

    return { riskCount: (analysisResult.risksList || []).length };
  },
});

// --- WORKFLOW COMPOSITIONS ---

export const documentWorkflow = new Workflow({
  id: 'document-processing-workflow',
  inputSchema: z.object({
    orgId: z.string(),
    matterId: z.string(),
    documentId: z.string(),
    rawText: z.string(),
    pageCount: z.number(),
  }),
  outputSchema: z.any(),
});

documentWorkflow
  .then(extractClausesStep)
  .then(generateTimelineStep)
  .then(analyzeRisksStep)
  .commit();

// 1. Research Workflow
export const researchWorkflow = new Workflow({
  id: 'research-workflow',
  inputSchema: z.object({
    query: z.string(),
    orgId: z.string(),
    matterId: z.string(),
  }),
  outputSchema: z.any(),
});

const runResearchStep = createStep({
  id: 'run-research-step',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ getInitData }) => {
    const { query } = getInitData<any>();
    const res = await researchAgent.generate(`Search query: ${query}. Create a synthesis of research findings.`);
    return { summary: res.text };
  }
});

researchWorkflow.then(runResearchStep).commit();

// 2. Redline Workflow
export const redlineWorkflow = new Workflow({
  id: 'redline-workflow',
  inputSchema: z.object({
    contractId: z.string().optional(),
    diffHtml: z.string(),
    contractType: z.string(),
    playbookPositions: z.any(),
  }),
  outputSchema: z.any(),
});

const runRedlineStep = createStep({
  id: 'run-redline-step',
  inputSchema: z.object({
    contractId: z.string().optional(),
    diffHtml: z.string(),
    contractType: z.string(),
    playbookPositions: z.any(),
  }),
  outputSchema: z.object({
    redlines: z.string(),
  }),
  execute: async ({ getInitData }) => {
    const { contractId, diffHtml, contractType, playbookPositions } = getInitData<any>();
    const prompt = `
      Analyze this diff HTML for a ${contractType} contract:
      ${diffHtml}
      
      Compare it against our playbook positions: ${JSON.stringify(playbookPositions)}.
      Identify key changes, issues, and suggest redlines or alternative text.
      Return ONLY a valid JSON object matching this structure:
      {
        "findings": [
          { "clauseType": "string", "severity": "high" | "medium" | "low", "description": "what changed and why it is a risk", "suggestion": "suggested alternative text" }
        ]
      }

      Do not wrap in markdown or backticks. JSON only.
    `;
    const res = await negotiationAgent.generate(prompt);
    
    let parsed: any = { findings: [] };
    try {
      const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse redline response:', e);
    }

    if (contractId) {
      const contract = await prisma.contract.findUnique({ where: { id: contractId } });
      const existingMeta = (contract?.metadata as Record<string, any>) || {};
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          metadata: {
            ...existingMeta,
            _redlineAnalysis: parsed.findings || [],
            _redlineStatus: 'DONE'
          }
        }
      });
    }

    return { redlines: res.text };
  }
});

redlineWorkflow.then(runRedlineStep).commit();

// 3. Negotiation Workflow
export const negotiationRoundWorkflow = new Workflow({
  id: 'negotiation-workflow',
  inputSchema: z.object({
    roundHistory: z.any(),
    playbookPositions: z.any(),
  }),
  outputSchema: z.any(),
});

const runNegotiationStep = createStep({
  id: 'run-negotiation-step',
  inputSchema: z.object({
    roundHistory: z.any(),
    playbookPositions: z.any(),
  }),
  outputSchema: z.object({
    offer: z.string(),
  }),
  execute: async ({ getInitData }) => {
    const { roundHistory, playbookPositions } = getInitData<any>();
    const prompt = `Analyze round history: ${JSON.stringify(roundHistory)}. Generate next concession offer using our playbook: ${JSON.stringify(playbookPositions)}`;
    const res = await negotiationAgent.generate(prompt);
    return { offer: res.text };
  }
});

negotiationRoundWorkflow.then(runNegotiationStep).commit();

// 4. Playbook Audit Workflow
export const playbookAuditWorkflow = new Workflow({
  id: 'playbook-audit-workflow',
  inputSchema: z.object({
    documentId: z.string(),
    playbookId: z.string(),
    instanceId: z.string().optional(),
  }),
  outputSchema: z.any(),
});

const runPlaybookAuditStep = createStep({
  id: 'run-playbook-audit-step',
  inputSchema: z.object({
    documentId: z.string(),
    playbookId: z.string(),
    instanceId: z.string().optional(),
  }),
  outputSchema: z.object({
    auditResult: z.string(),
  }),
  execute: async ({ getInitData }) => {
    const { documentId, instanceId } = getInitData<any>();
    
    // Fetch contract clauses
    const contract = await prisma.contract.findUnique({
      where: { id: documentId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { clauses: true } }
      }
    });
    const clauses = contract?.versions[0]?.clauses ?? [];
    const clausesText = clauses.map(c => `[Clause ID ${c.id} - ${c.clauseType}]: ${c.content}`).join('\n');

    const prompt = `
      Perform a playbook compliance audit on this document.
      Here are the extracted contract clauses:
      ---
      ${clausesText}
      ---

      Identify any deviations, violations of red-lines, and suggest compliant redline edits.
      Return ONLY a valid JSON object matching this structure:
      {
        "aiSummary": "2-3 sentences summary of the contract",
        "keyRisks": [
          { "title": "brief description of risk", "description": "detailed explanation", "severity": "high" | "medium" | "low" }
        ],
        "nonStandardTerms": ["brief description of non-standard term"],
        "approvalRecommendation": "approve" | "review_required" | "reject_advised"
      }

      Do not wrap in markdown or backticks. JSON only.
    `;
    const res = await playbookComplianceAgent.generate(prompt);
    
    let parsed: any = {};
    try {
      const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse playbook audit response:', e);
      parsed = {
        aiSummary: res.text.slice(0, 500),
        keyRisks: [],
        nonStandardTerms: [],
        approvalRecommendation: 'review_required'
      };
    }

    if (instanceId) {
      await prisma.approvalInstance.update({
        where: { id: instanceId },
        data: {
          aiSummary: parsed.aiSummary,
          keyRisks: parsed.keyRisks || [],
          nonStandardTerms: parsed.nonStandardTerms || [],
          approvalRecommendation: parsed.approvalRecommendation,
        }
      });
    }

    return { auditResult: res.text };
  }
});

playbookAuditWorkflow.then(runPlaybookAuditStep).commit();


// Initialize Mastra Instance
export const mastra = new Mastra({
  agents: {
    documentProcessingAgent,
    timelineAgent,
    riskAgent,
    qaAgent,
    benchmarkAgent,
    citationAgent,
    researchAgent,
    draftingAgent,
    negotiationAgent,
    playbookComplianceAgent,
  },
  workflows: {
    documentWorkflow,
    researchWorkflow,
    redlineWorkflow,
    negotiationRoundWorkflow,
    playbookAuditWorkflow,
  },
});
