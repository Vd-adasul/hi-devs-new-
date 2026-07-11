import neo4j, { Driver } from 'neo4j-driver';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma.js';

dotenv.config();

export class Neo4jService {
  private static instance: Neo4jService | null = null;
  private driver: Driver | null = null;

  private constructor() {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (uri && user && password) {
      try {
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        console.log('Neo4j Driver initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize Neo4j driver:', err);
      }
    } else {
      console.warn('Neo4j environment variables missing. Neo4j operations will be disabled, falling back to PostgreSQL.');
    }
  }

  public static getInstance(): Neo4jService {
    if (!Neo4jService.instance) {
      Neo4jService.instance = new Neo4jService();
    }
    return Neo4jService.instance;
  }

  public getDriver(): Driver | null {
    return this.driver;
  }

  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
  }

  public async createMatterNode(matterId: string, name: string, orgId: string): Promise<void> {
    // Write to PostgreSQL
    try {
      await prisma.graphNode.upsert({
        where: { id: matterId },
        update: { label: name, type: 'matter', metadata: { orgId } },
        create: { id: matterId, label: name, type: 'matter', metadata: { orgId } }
      });
    } catch (dbErr) {
      console.error(`Postgres error: Failed to upsert Matter node ${matterId}:`, dbErr);
    }

    // Write to Neo4j
    if (!this.driver) return;
    const session = this.driver.session();
    try {
      await session.executeWrite(tx =>
        tx.run(
          `MERGE (m:Matter {id: $matterId})
           SET m.name = $name, m.orgId = $orgId
           RETURN m`,
          { matterId, name, orgId }
        )
      );
    } catch (err) {
      console.error(`Failed to create Matter node ${matterId} in Neo4j:`, err);
    } finally {
      await session.close();
    }
  }

  public async createDocumentNode(docId: string, matterId: string, name: string, type: string = 'general'): Promise<void> {
    // Write to PostgreSQL
    try {
      await prisma.$transaction([
        prisma.graphNode.upsert({
          where: { id: docId },
          update: { label: name, type: 'document', metadata: { docType: type } },
          create: { id: docId, label: name, type: 'document', metadata: { docType: type } }
        }),
        prisma.graphEdge.upsert({
          where: {
            sourceId_targetId_type: {
              sourceId: matterId,
              targetId: docId,
              type: 'CONTAINS'
            }
          },
          update: {},
          create: {
            sourceId: matterId,
            targetId: docId,
            type: 'CONTAINS'
          }
        })
      ]);
    } catch (dbErr) {
      console.error(`Postgres error: Failed to link Document node ${docId} to Matter ${matterId}:`, dbErr);
    }

    // Write to Neo4j
    if (!this.driver) return;
    const session = this.driver.session();
    try {
      await session.executeWrite(tx =>
        tx.run(
          `MERGE (d:Document {id: $docId})
           SET d.name = $name, d.type = $type
           WITH d
           MATCH (m:Matter {id: $matterId})
           MERGE (m)-[:CONTAINS]->(d)
           RETURN d`,
          { docId, matterId, name, type }
        )
      );
    } catch (err) {
      console.error(`Failed to create Document node ${docId} in Neo4j:`, err);
    } finally {
      await session.close();
    }
  }

  public async createClauseNode(
    clauseId: string,
    docId: string,
    type: string,
    text: string,
    riskLevel: string = 'low'
  ): Promise<void> {
    // Write to PostgreSQL
    try {
      await prisma.$transaction([
        prisma.graphNode.upsert({
          where: { id: clauseId },
          update: { label: type, type: 'clause', metadata: { text, riskLevel } },
          create: { id: clauseId, label: type, type: 'clause', metadata: { text, riskLevel } }
        }),
        prisma.graphEdge.upsert({
          where: {
            sourceId_targetId_type: {
              sourceId: docId,
              targetId: clauseId,
              type: 'HAS'
            }
          },
          update: {},
          create: {
            sourceId: docId,
            targetId: clauseId,
            type: 'HAS'
          }
        })
      ]);
    } catch (dbErr) {
      console.error(`Postgres error: Failed to link Clause node ${clauseId} to Document ${docId}:`, dbErr);
    }

    // Write to Neo4j
    if (!this.driver) return;
    const session = this.driver.session();
    try {
      await session.executeWrite(tx =>
        tx.run(
          `MERGE (c:Clause {id: $clauseId})
           SET c.type = $type, c.text = $text, c.riskLevel = $riskLevel
           WITH c
           MATCH (d:Document {id: $docId})
           MERGE (d)-[:HAS]->(c)
           RETURN c`,
          { clauseId, docId, type, text, riskLevel }
        )
      );
    } catch (err) {
      console.error(`Failed to create Clause node ${clauseId} in Neo4j:`, err);
    } finally {
      await session.close();
    }
  }

  public async createPartyNode(clauseId: string, name: string, role: string): Promise<void> {
    const partyId = `party_${name.replace(/\s+/g, '_')}`;
    // Write to PostgreSQL
    try {
      await prisma.$transaction([
        prisma.graphNode.upsert({
          where: { id: partyId },
          update: { label: name, type: 'party', metadata: { role } },
          create: { id: partyId, label: name, type: 'party', metadata: { role } }
        }),
        prisma.graphEdge.upsert({
          where: {
            sourceId_targetId_type: {
              sourceId: clauseId,
              targetId: partyId,
              type: 'BINDS'
            }
          },
          update: {},
          create: {
            sourceId: clauseId,
            targetId: partyId,
            type: 'BINDS'
          }
        })
      ]);
    } catch (dbErr) {
      console.error(`Postgres error: Failed to link Party node ${name} to Clause ${clauseId}:`, dbErr);
    }

    // Write to Neo4j
    if (!this.driver) return;
    const session = this.driver.session();
    try {
      await session.executeWrite(tx =>
        tx.run(
          `MERGE (p:Party {name: $name})
           SET p.role = $role
           WITH p
           MATCH (c:Clause {id: $clauseId})
           MERGE (c)-[:BINDS]->(p)
           RETURN p`,
          { clauseId, name, role }
        )
      );
    } catch (err) {
      console.error(`Failed to create Party node ${name} in Neo4j:`, err);
    } finally {
      await session.close();
    }
  }

  public async createCaseNode(clauseId: string, caseId: string, title: string, court: string = '', year: string = ''): Promise<void> {
    // Write to PostgreSQL
    try {
      await prisma.$transaction([
        prisma.graphNode.upsert({
          where: { id: caseId },
          update: { label: title, type: 'case', metadata: { court, year } },
          create: { id: caseId, label: title, type: 'case', metadata: { court, year } }
        }),
        prisma.graphEdge.upsert({
          where: {
            sourceId_targetId_type: {
              sourceId: clauseId,
              targetId: caseId,
              type: 'CITES'
            }
          },
          update: {},
          create: {
            sourceId: clauseId,
            targetId: caseId,
            type: 'CITES'
          }
        })
      ]);
    } catch (dbErr) {
      console.error(`Postgres error: Failed to link Case node ${title} to Clause ${clauseId}:`, dbErr);
    }

    // Write to Neo4j
    if (!this.driver) return;
    const session = this.driver.session();
    try {
      await session.executeWrite(tx =>
        tx.run(
          `MERGE (c:Case {id: $caseId})
           SET c.title = $title, c.court = $court, c.year = $year
           WITH c
           MATCH (cl:Clause {id: $clauseId})
           MERGE (cl)-[:CITES]->(c)
           RETURN c`,
          { clauseId, caseId, title, court, year }
        )
      );
    } catch (err) {
      console.error(`Failed to create Case node ${title} in Neo4j:`, err);
    } finally {
      await session.close();
    }
  }

  public async getGraphForMatter(matterId: string): Promise<{ nodes: any[]; edges: any[] }> {
    // If Neo4j is available, query from Neo4j
    if (this.driver) {
      const session = this.driver.session();
      try {
        const result = await session.executeRead(tx =>
          tx.run(
            `MATCH (m:Matter {id: $matterId})
             OPTIONAL MATCH (m)-[r1:CONTAINS]->(d:Document)
             OPTIONAL MATCH (d)-[r2:HAS]->(c:Clause)
             OPTIONAL MATCH (c)-[r3:BINDS]->(p:Party)
             OPTIONAL MATCH (c)-[r4:CITES]->(ca:Case)
             RETURN m, d, c, p, ca, r1, r2, r3, r4`,
            { matterId }
          )
        );

        const nodesMap = new Map<string, any>();
        const edgesList: any[] = [];

        result.records.forEach(record => {
          const m = record.get('m');
          const d = record.get('d');
          const c = record.get('c');
          const p = record.get('p');
          const ca = record.get('ca');

          if (m) {
            nodesMap.set(m.properties.id || m.identity.toString(), {
              id: m.properties.id || m.identity.toString(),
              label: m.properties.name || 'Matter',
              type: 'matter',
            });
          }
          if (d) {
            nodesMap.set(d.properties.id || d.identity.toString(), {
              id: d.properties.id || d.identity.toString(),
              label: d.properties.name || 'Document',
              type: 'document',
              docType: d.properties.type,
            });
            edgesList.push({
              source: m.properties.id || m.identity.toString(),
              target: d.properties.id || d.identity.toString(),
              label: 'contains',
            });
          }
          if (c) {
            nodesMap.set(c.properties.id || c.identity.toString(), {
              id: c.properties.id || c.identity.toString(),
              label: c.properties.type || 'Clause',
              text: c.properties.text,
              type: 'clause',
              riskLevel: c.properties.riskLevel,
            });
            edgesList.push({
              source: d.properties.id || d.identity.toString(),
              target: c.properties.id || c.identity.toString(),
              label: 'has clause',
            });
          }
          if (p) {
            const pId = `party_${p.properties.name.replace(/\s+/g, '_')}`;
            nodesMap.set(pId, {
              id: pId,
              label: p.properties.name,
              type: 'entity',
              role: p.properties.role,
            });
            edgesList.push({
              source: c.properties.id || c.identity.toString(),
              target: pId,
              label: 'binds',
            });
          }
          if (ca) {
            nodesMap.set(ca.properties.id || ca.identity.toString(), {
              id: ca.properties.id || ca.identity.toString(),
              label: ca.properties.title,
              type: 'citation',
              court: ca.properties.court,
              year: ca.properties.year,
            });
            edgesList.push({
              source: c.properties.id || c.identity.toString(),
              target: ca.properties.id || ca.identity.toString(),
              label: 'cites',
            });
          }
        });

        const edgeKeys = new Set<string>();
        const uniqueEdges = edgesList.filter(e => {
          const key = `${e.source}->${e.target}`;
          if (edgeKeys.has(key)) return false;
          edgeKeys.add(key);
          return true;
        });

        return {
          nodes: Array.from(nodesMap.values()),
          edges: uniqueEdges,
        };
      } catch (err) {
        console.error(`Failed to get Graph for Matter ${matterId} from Neo4j, falling back to PostgreSQL:`, err);
      } finally {
        await session.close();
      }
    }

    // Fallback/Primary query from PostgreSQL
    try {
      // Find the matter node
      const matterNode = await prisma.graphNode.findUnique({
        where: { id: matterId }
      });
      if (!matterNode) return { nodes: [], edges: [] };

      const nodes: any[] = [{
        id: matterNode.id,
        label: matterNode.label,
        type: 'matter'
      }];
      const edges: any[] = [];

      // Find all document edges from this matter
      const docEdges = await prisma.graphEdge.findMany({
        where: { sourceId: matterId, type: 'CONTAINS' },
        include: { targetNode: true }
      });

      for (const de of docEdges) {
        nodes.push({
          id: de.targetNode.id,
          label: de.targetNode.label,
          type: 'document',
          docType: (de.targetNode.metadata as any)?.docType || 'general'
        });
        edges.push({
          source: matterId,
          target: de.targetNode.id,
          label: 'contains'
        });

        // Find clause edges from this document
        const clauseEdges = await prisma.graphEdge.findMany({
          where: { sourceId: de.targetNode.id, type: 'HAS' },
          include: { targetNode: true }
        });

        for (const ce of clauseEdges) {
          nodes.push({
            id: ce.targetNode.id,
            label: ce.targetNode.label,
            type: 'clause',
            text: (ce.targetNode.metadata as any)?.text || '',
            riskLevel: (ce.targetNode.metadata as any)?.riskLevel || 'low'
          });
          edges.push({
            source: de.targetNode.id,
            target: ce.targetNode.id,
            label: 'has clause'
          });

          // Find party/case edges from this clause
          const clauseSubEdges = await prisma.graphEdge.findMany({
            where: { sourceId: ce.targetNode.id },
            include: { targetNode: true }
          });

          for (const cse of clauseSubEdges) {
            const isParty = cse.targetNode.type === 'party';
            nodes.push({
              id: cse.targetNode.id,
              label: cse.targetNode.label,
              type: isParty ? 'entity' : 'citation',
              role: (cse.targetNode.metadata as any)?.role,
              court: (cse.targetNode.metadata as any)?.court,
              year: (cse.targetNode.metadata as any)?.year
            });
            edges.push({
              source: ce.targetNode.id,
              target: cse.targetNode.id,
              label: cse.type === 'BINDS' ? 'binds' : 'cites'
            });
          }
        }
      }

      // Deduplicate nodes
      const seenNodes = new Set<string>();
      const dedupNodes = nodes.filter(n => {
        if (seenNodes.has(n.id)) return false;
        seenNodes.add(n.id);
        return true;
      });

      return { nodes: dedupNodes, edges };
    } catch (pgErr) {
      console.error('Failed to get Graph for Matter from Postgres:', pgErr);
      return { nodes: [], edges: [] };
    }
  }

  public async getGlobalOverviewGraph(orgId: string): Promise<{ nodes: any[]; edges: any[] }> {
    if (this.driver) {
      const session = this.driver.session();
      try {
        const result = await session.executeRead(tx =>
          tx.run(
            `MATCH (m:Matter {orgId: $orgId})
             OPTIONAL MATCH (m)-[r1:CONTAINS]->(d:Document)
             OPTIONAL MATCH (d)-[r2:HAS]->(c:Clause)
             OPTIONAL MATCH (c)-[r3:BINDS]->(p:Party)
             OPTIONAL MATCH (c)-[r4:CITES]->(ca:Case)
             RETURN m, d, c, p, ca, r1, r2, r3, r4`,
            { orgId }
          )
        );

        const nodesMap = new Map<string, any>();
        const edgesList: any[] = [];

        result.records.forEach(record => {
          const m = record.get('m');
          const d = record.get('d');
          const c = record.get('c');
          const p = record.get('p');
          const ca = record.get('ca');

          if (m) {
            nodesMap.set(m.properties.id || m.identity.toString(), {
              id: m.properties.id || m.identity.toString(),
              label: m.properties.name || 'Matter',
              type: 'matter',
            });
          }
          if (d) {
            nodesMap.set(d.properties.id || d.identity.toString(), {
              id: d.properties.id || d.identity.toString(),
              label: d.properties.name || 'Document',
              type: 'document',
              docType: d.properties.type,
            });
            if (m) {
              edgesList.push({
                source: m.properties.id || m.identity.toString(),
                target: d.properties.id || d.identity.toString(),
                label: 'contains',
              });
            }
          }
          if (c) {
            nodesMap.set(c.properties.id || c.identity.toString(), {
              id: c.properties.id || c.identity.toString(),
              label: c.properties.type || 'Clause',
              text: c.properties.text,
              type: 'clause',
              riskLevel: c.properties.riskLevel,
            });
            if (d) {
              edgesList.push({
                source: d.properties.id || d.identity.toString(),
                target: c.properties.id || c.identity.toString(),
                label: 'has clause',
              });
            }
          }
          if (p) {
            const pId = `party_${p.properties.name.replace(/\s+/g, '_')}`;
            nodesMap.set(pId, {
              id: pId,
              label: p.properties.name,
              type: 'entity',
              role: p.properties.role,
            });
            if (c) {
              edgesList.push({
                source: c.properties.id || c.identity.toString(),
                target: pId,
                label: 'binds',
              });
            }
          }
          if (ca) {
            nodesMap.set(ca.properties.id || ca.identity.toString(), {
              id: ca.properties.id || ca.identity.toString(),
              label: ca.properties.title,
              type: 'citation',
              court: ca.properties.court,
              year: ca.properties.year,
            });
            if (c) {
              edgesList.push({
                source: c.properties.id || c.identity.toString(),
                target: ca.properties.id || ca.identity.toString(),
                label: 'cites',
              });
            }
          }
        });

        const edgeKeys = new Set<string>();
        const uniqueEdges = edgesList.filter(e => {
          const key = `${e.source}->${e.target}`;
          if (edgeKeys.has(key)) return false;
          edgeKeys.add(key);
          return true;
        });

        return {
          nodes: Array.from(nodesMap.values()),
          edges: uniqueEdges,
        };
      } catch (err) {
        console.error('Failed to get global graph from Neo4j, falling back to PostgreSQL:', err);
      } finally {
        await session.close();
      }
    }

    // Fallback/Primary query from PostgreSQL
    try {
      const dbNodes = await prisma.graphNode.findMany();
      const dbEdges = await prisma.graphEdge.findMany();

      const nodes = dbNodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type === 'party' ? 'entity' : (n.type === 'case' ? 'citation' : n.type),
        docType: (n.metadata as any)?.docType,
        text: (n.metadata as any)?.text,
        riskLevel: (n.metadata as any)?.riskLevel,
        role: (n.metadata as any)?.role,
        court: (n.metadata as any)?.court,
        year: (n.metadata as any)?.year
      }));

      const edges = dbEdges.map(e => ({
        source: e.sourceId,
        target: e.targetId,
        label: e.type === 'CONTAINS' ? 'contains' : (e.type === 'HAS' ? 'has clause' : (e.type === 'BINDS' ? 'binds' : 'cites'))
      }));

      return { nodes, edges };
    } catch (pgErr) {
      console.error('Failed to query global graph from Postgres:', pgErr);
      return { nodes: [], edges: [] };
    }
  }

  public async getClauseNeighbors(clauseId: string): Promise<any[]> {
    if (this.driver) {
      const session = this.driver.session();
      try {
        const result = await session.executeRead(tx =>
          tx.run(
            `MATCH (c:Clause {id: $clauseId})
             OPTIONAL MATCH (c)-[:BINDS]->(p:Party)
             OPTIONAL MATCH (c)-[:CITES]->(ca:Case)
             OPTIONAL MATCH (d:Document)-[:HAS]->(c)
             RETURN c, p, ca, d`,
            { clauseId }
          )
        );

        const neighbors: any[] = [];
        result.records.forEach(record => {
          const p = record.get('p');
          const ca = record.get('ca');
          const d = record.get('d');

          if (p) {
            neighbors.push({
              type: 'Party',
              summary: `Binds Party: ${p.properties.name} (${p.properties.role})`,
            });
          }
          if (ca) {
            neighbors.push({
              type: 'Case',
              summary: `Cites Case Precedent: ${ca.properties.title} [Court: ${ca.properties.court}, Year: ${ca.properties.year}]`,
            });
          }
          if (d) {
            neighbors.push({
              type: 'Document',
              summary: `Part of Document: ${d.properties.name}`,
            });
          }
        });
        return neighbors;
      } catch (err) {
        console.error('Failed to get Clause Neighbors from Neo4j, falling back to PostgreSQL:', err);
      } finally {
        await session.close();
      }
    }

    // Fallback/Primary query from PostgreSQL
    try {
      const edges = await prisma.graphEdge.findMany({
        where: {
          OR: [
            { sourceId: clauseId },
            { targetId: clauseId }
          ]
        },
        include: {
          sourceNode: true,
          targetNode: true
        }
      });

      const neighbors: any[] = [];
      for (const e of edges) {
        if (e.sourceId === clauseId) {
          // Connected target node (e.g. party or case)
          if (e.targetNode.type === 'party') {
            neighbors.push({
              type: 'Party',
              summary: `Binds Party: ${e.targetNode.label} (${(e.targetNode.metadata as any)?.role || ''})`
            });
          } else if (e.targetNode.type === 'case') {
            neighbors.push({
              type: 'Case',
              summary: `Cites Case Precedent: ${e.targetNode.label} [Court: ${(e.targetNode.metadata as any)?.court || ''}, Year: ${(e.targetNode.metadata as any)?.year || ''}]`
            });
          }
        } else {
          // Connected source node (e.g. document)
          if (e.sourceNode.type === 'document') {
            neighbors.push({
              type: 'Document',
              summary: `Part of Document: ${e.sourceNode.label}`
            });
          }
        }
      }
      return neighbors;
    } catch (pgErr) {
      console.error('Failed to get Clause Neighbors from Postgres:', pgErr);
      return [];
    }
  }
}
