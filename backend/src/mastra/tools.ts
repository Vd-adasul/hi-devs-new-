import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { QdrantService } from '../services/qdrant.service.js';
import { getEmbedding } from '../utils/embedding.js';
import { objectIdToUuid } from '../utils/uuid.js';
import { Neo4jService } from '../services/neo4j.service.js';

const qdrantService = QdrantService.getInstance();

function padTo(vec: number[], dims: number): number[] {
  if (vec.length >= dims) return vec.slice(0, dims);
  return [...vec, ...new Array(dims - vec.length).fill(0)];
}

// Tool to store clauses, generate embeddings, and save to Qdrant
export const storeClausesTool = createTool({
  id: 'store-clauses',
  description: 'Stores extracted clauses in PostgreSQL and indexes them in Qdrant Cloud for semantic vector search.',
  inputSchema: z.object({
    orgId: z.string(),
    matterId: z.string(),
    documentId: z.string(),
    clauses: z.array(
      z.object({
        category: z.string(),
        rawText: z.string(),
        pageNumber: z.number(),
      })
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    clauseCount: z.number(),
  }),
  execute: async ({ orgId, matterId, documentId, clauses }) => {
    try {
      // Find the version ID for this documentId
      const contract = await prisma.contract.findUnique({
        where: { id: documentId },
        select: { currentVersionId: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1, select: { id: true } } }
      });
      const versionId = contract?.currentVersionId || contract?.versions[0]?.id;

      if (!versionId) {
        throw new Error(`Could not find a valid version for contract: ${documentId}`);
      }

      // Delete existing clauses for this versionId to be safe (idempotency)
      await prisma.contractClause.deleteMany({ where: { versionId } });

      const points: any[] = [];

      for (let i = 0; i < clauses.length; i++) {
        const clause = clauses[i];
        
        // 1. Save to PostgreSQL
        const createdClause = await prisma.contractClause.create({
          data: {
            versionId,
            clauseType: clause.category || 'General',
            content: clause.rawText || '',
            sortOrder: i,
          }
        });

        // 2. Generate vector embedding
        const vector = await getEmbedding(clause.rawText);

        // 3. Queue for Qdrant upload
        points.push({
          id: objectIdToUuid(createdClause.id),
          vector: padTo(vector, 3072),
          payload: {
            org_id: orgId,
            matter_id: matterId,
            document_id: documentId,
            clause_id: createdClause.id,
            clause_type: clause.category,
            page_number: clause.pageNumber,
            raw_text: clause.rawText,
          },
        });
      }

      // 4. Batch upsert vectors to Qdrant Cloud
      if (points.length > 0) {
        await qdrantService.upsertPoints('legal_documents', points);
      }

      return { success: true, clauseCount: clauses.length };
    } catch (error) {
      console.error('Error in storeClausesTool:', error);
      throw error;
    }
  },
});

// Tool to search Qdrant for similar clauses
export const searchQdrantTool = createTool({
  id: 'search-qdrant',
  description: 'Searches the vector database for clauses semantically similar to the query.',
  inputSchema: z.object({
    orgId: z.string(),
    queryText: z.string(),
    limit: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        clauseId: z.string(),
        rawText: z.string(),
        clauseType: z.string(),
        score: z.number(),
        pageNumber: z.number(),
      })
    ),
  }),
  execute: async ({ orgId, queryText, limit }) => {
    try {
      const vector = await getEmbedding(queryText);
      const searchRes = await qdrantService.searchPoints('legal_documents', padTo(vector, 3072), orgId, limit);
      const neo4jService = Neo4jService.getInstance();

      const results = await Promise.all(
        searchRes.map(async (point: any) => {
          const clauseId = point.payload.clause_id;
          let graphContext = '';
          try {
            const neighbors = await neo4jService.getClauseNeighbors(clauseId);
            if (neighbors && neighbors.length > 0) {
              graphContext = ` [Graph Context: ${neighbors.map(n => n.summary).join('; ')}]`;
            }
          } catch (neoErr) {
            console.warn('Failed to retrieve Neo4j neighbors for GraphRAG context:', neoErr);
          }

          return {
            clauseId,
            rawText: (point.payload.raw_text || '') + graphContext,
            clauseType: point.payload.clause_type,
            score: point.score,
            pageNumber: point.payload.page_number,
          };
        })
      );

      return { results };
    } catch (error) {
      console.error('Error in searchQdrantTool:', error);
      throw error;
    }
  },
});

// Tool to verify case laws and legal databases (AIR, Kanoon, CaseLaw stubs)
export const verifyCitationTool = createTool({
  id: 'verify-citation',
  description: 'Verifies if a specific statutory or case law citation exists in external legal databases.',
  inputSchema: z.object({
    citation: z.string(),
  }),
  outputSchema: z.object({
    verified: z.boolean(),
    title: z.string(),
    source: z.string(),
  }),
  execute: async ({ citation }) => {
    try {
      const query = encodeURIComponent(citation);
      const res = await fetch(`https://api.case.law/v1/cases/?search=${query}&limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json() as any;
        if (data.results && data.results.length > 0) {
          const topCase = data.results[0];
          return {
            verified: true,
            title: topCase.name || topCase.name_abbreviation,
            source: `CaseLaw API - ${topCase.reporter.name} Vol ${topCase.volume.volume_number}`,
          };
        }
      }

      // Check Indian Kanoon stub/search fallback
      const kanoonRes = await fetch(`https://indiankanoon.org/search/?formInput=${query}`, {
        method: 'GET',
      });

      if (kanoonRes.ok) {
        return {
          verified: true,
          title: citation,
          source: 'Indian Kanoon Search Verify',
        };
      }

      return {
        verified: false,
        title: citation,
        source: 'Not Found in Legal Databases',
      };
    } catch (error) {
      console.error('Error in verifyCitationTool:', error);
      return { verified: false, title: citation, source: 'API Error Verification' };
    }
  },
});
