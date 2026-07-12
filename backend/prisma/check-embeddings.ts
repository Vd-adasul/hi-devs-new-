import { prisma } from '../src/lib/prisma.js';

async function checkEmbeddings() {
  const contractId = 'cmreyjztn003qvogracgxndi0';
  const clauses = await prisma.contractClause.findMany({
    where: { version: { contractId } },
    select: {
      id: true,
      clauseType: true,
      embeddedAt: true,
      versionId: true,
      version: {
        select: {
          versionNumber: true
        }
      }
    }
  });

  console.log(`Checking embeddings for ${clauses.length} clauses:`);
  for (const c of clauses) {
    console.log(`Clause ID: ${c.id}, Type: ${c.clauseType}, Version: ${c.version.versionNumber}, EmbeddedAt: ${c.embeddedAt}`);
  }
}

checkEmbeddings();
