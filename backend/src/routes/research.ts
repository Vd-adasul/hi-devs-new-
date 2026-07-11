import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requirePermission } from '../middleware/permissions.js'
import { prisma } from '../lib/prisma.js'
import { IndianKanoonService } from '../services/indiankanoon.service.js'
import { Neo4jService } from '../services/neo4j.service.js'
import { researchAgent } from '../mastra/index.js'
import { verifyInputSafety, verifyResponseSafety } from '../lib/safety.js'

export async function researchRoutes(app: FastifyInstance) {
  const indianKanoonService = IndianKanoonService.getInstance()
  const neo4jService = Neo4jService.getInstance()

  // 1. GET /api/v1/research/search — Standalone Search Indian Kanoon
  app.get('/search', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const q = z.object({
      query: z.string().min(1)
    }).safeParse(req.query)

    if (!q.success) {
      return reply.status(400).send({ detail: 'query parameter is required' })
    }

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(q.data.query, 'Precedent Lookup Query')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    try {
      app.log.info(`Research: Standalone search for: "${q.data.query}"`)
      const results = await indianKanoonService.search(q.data.query)
      return reply.send({ data: results.docs ?? [] })
    } catch (err: any) {
      app.log.error(err, 'IndianKanoon search failed')
      return reply.status(500).send({ detail: err.message })
    }
  })

  // 2. POST /api/v1/research/memo — Standalone Memo Synthesis
  app.post('/memo', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const body = z.object({
      query: z.string().min(1),
      docIds: z.array(z.string()).default([])
    }).safeParse(req.body)

    if (!body.success) {
      return reply.status(400).send({ detail: 'Invalid body', issues: body.error.issues })
    }

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(body.data.query, 'Statutory Memo Query')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    try {
      app.log.info(`Research: Generating standalone memo for query: "${body.data.query}"`)
      const memo = [
        `Research Memo for: ${body.data.query}`,
        '',
        `Reviewed ${body.data.docIds.length} precedent${body.data.docIds.length === 1 ? '' : 's'}.`,
        'This environment is using the Indian Kanoon integration layer currently available in the backend.',
      ].join('\n')
      
      return reply.send({ memo })
    } catch (err: any) {
      app.log.error(err, 'Memo generation failed')
      return reply.status(500).send({ detail: err.message })
    }
  })

  // 3. POST /api/v1/research — Create Research Memo for a Matter
  app.post('/', { preHandler: requirePermission('create', 'contract') }, async (req, reply) => {
    const { orgId } = req.user
    const body = z.object({
      query: z.string().min(1),
      matterId: z.string().min(1)
    }).safeParse(req.body)

    if (!body.success) {
      return reply.status(400).send({ detail: 'Invalid body', issues: body.error.issues })
    }

    const { query, matterId } = body.data

    // Enkrypt AI Input Safety Check
    try {
      await verifyInputSafety(query, 'Matter Research Query')
    } catch (safetyErr: any) {
      return reply.status(400).send({ detail: safetyErr.message })
    }

    try {
      const matter = await prisma.matter.findFirst({
        where: { id: matterId, orgId, deletedAt: null }
      })

      if (!matter) {
        return reply.status(404).send({ detail: 'Matter not found' })
      }

      app.log.info(`Research: Searching IndianKanoon for: "${query}" for matter ${matterId}...`)
      const ikResults = await indianKanoonService.search(query)
      const cases = (ikResults.docs || []).slice(0, 5)

      if (cases.length === 0) {
        return reply.send({
          memo: `No statutory records or case precedents found on IndianKanoon matching query "${query}".`,
          cases: []
        })
      }

      // Format context for agent prompt
      const caseTextContext = cases.map((c, idx) => {
        return `Case Precedent [${idx + 1}]:\nTitle: ${c.title}\nSource: ${c.docsource}\nSummary/Headline: ${c.headline || 'No summary available.'}`
      }).join('\n\n---\n\n')

      const prompt = `
        You are a highly analytical Indian statutory researcher.
        A lawyer has requested research on the issue: "${query}" for Matter: "${matter.name}".
        Here are the top matches found on IndianKanoon:
        ---
        ${caseTextContext}
        ---

        Synthesize these case laws and statutes into a structured research memo containing:
        1. Research Issue
        2. Key Precedents & Holdings (cite each matching case by name)
        3. Practical Legal Impact on our Matter: "${matter.name}"
        4. Conclusion

        Be professional, grounded only in the facts provided, and do not hallucinate laws.
      `

      app.log.info('Research: Calling Mastra Research Agent to synthesize memo...')
      const agentRes = await researchAgent.generate(prompt)
      let memoText = agentRes.text

      // Enkrypt AI Response Safety Check
      memoText = await verifyResponseSafety(memoText, 'AI Generated Research Memo')

      const formattedCases = cases.map(c => ({
        id: c.tid.toString(),
        title: c.title,
        docsource: c.docsource,
        headline: c.headline,
        url: `https://indiankanoon.org/doc/${c.tid}/`
      }))

      // Save research memo in Postgres
      const memoRecord = await prisma.researchMemo.create({
        data: {
          orgId,
          matterId,
          query,
          memo: memoText,
          cases: formattedCases
        }
      })

      // Register cases in Knowledge Graph
      app.log.info('Research: Registering cases in Knowledge Graph...')
      for (const c of cases) {
        await neo4jService.createCaseNode(
          `matter_ref_${matterId}`,
          c.tid.toString(),
          c.title,
          c.docsource
        )
      }

      return reply.status(201).send({
        message: 'Legal research memo synthesized successfully.',
        memoId: memoRecord.id,
        memo: memoText,
        cases: formattedCases
      })

    } catch (err: any) {
      app.log.error(err, 'Research memo creation failed')
      return reply.status(500).send({ detail: err.message })
    }
  })

  // 4. GET /api/v1/research — List Research Memos for a Matter
  app.get('/', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const { orgId } = req.user
    const q = z.object({
      matterId: z.string().min(1)
    }).safeParse(req.query)

    if (!q.success) {
      return reply.status(400).send({ detail: 'matterId parameter is required' })
    }

    try {
      const list = await prisma.researchMemo.findMany({
        where: { orgId, matterId: q.data.matterId },
        orderBy: { createdAt: 'desc' }
      })
      return reply.send({ data: list })
    } catch (err: any) {
      app.log.error(err, 'Listing research memos failed')
      return reply.status(500).send({ detail: err.message })
    }
  })
}
