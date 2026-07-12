import { prisma } from '../src/lib/prisma.js';

async function query() {
  const contractId = 'cmreyjztn003qvogracgxndi0';
  const clauses = await prisma.contractClause.findMany({
    where: { version: { contractId } },
    take: 5,
    select: { clauseType: true, content: true }
  });
  console.log('Found clauses count:', clauses.length);
  for (const c of clauses) {
    console.log(`[${c.clauseType}]: ${c.content.slice(0, 100)}...`);
  }
}

query();
