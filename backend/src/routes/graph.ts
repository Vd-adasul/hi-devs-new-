import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requirePermission } from '../middleware/permissions.js'
import { Neo4jService } from '../services/neo4j.service.js'

export async function graphRoutes(app: FastifyInstance) {
  const neo4jService = Neo4jService.getInstance()

  // GET /api/v1/graph/overview — Neo4j/Postgres Global Overview Graph
  app.get('/overview', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const { orgId } = req.user
    try {
      app.log.info(`Graph: Fetching global graph overview for org: ${orgId}`)
      const graphData = await neo4jService.getGlobalOverviewGraph(orgId)
      return reply.send(graphData)
    } catch (err: any) {
      app.log.error(err, 'Failed to fetch global overview graph')
      return reply.status(500).send({ detail: err.message })
    }
  })

  // GET /api/v1/graph — Neo4j/Postgres Graph for a specific Matter
  app.get('/', { preHandler: requirePermission('view', 'contract') }, async (req, reply) => {
    const q = z.object({
      matterId: z.string().min(1)
    }).safeParse(req.query)

    if (!q.success) {
      return reply.status(400).send({ detail: 'matterId query parameter is required' })
    }

    try {
      app.log.info(`Graph: Fetching graph for matter: ${q.data.matterId}`)
      const graphData = await neo4jService.getGraphForMatter(q.data.matterId)
      return reply.send({ data: graphData })
    } catch (err: any) {
      app.log.error(err, 'Failed to fetch graph for matter')
      return reply.status(500).send({ detail: err.message })
    }
  })
}
