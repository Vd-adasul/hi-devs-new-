import { prisma } from '../src/lib/prisma.js';
import { searchClauses } from '../src/lib/embeddings.js';

async function testSearch() {
  const contractId = 'cmreyjztn003qvogracgxndi0';
  const orgId = 'cmreyjzkr0000vogrc12sbg1s'; // Let's check first what the organization ID is for the contract
  const c = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { orgId: true }
  });
  console.log('Contract orgId:', c?.orgId);
  if (!c) return;

  try {
    const matches = await searchClauses('Summarise Employment Agreement: Neecop Consultants Private Limited and CTO — risks, key terms, what stands out', c.orgId, 5, contractId);
    console.log('Matches count:', matches.length);
    for (const m of matches) {
      console.log(`[${m.similarity.toFixed(4)}] (${m.clauseType}): ${m.content.slice(0, 100)}...`);
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
}

testSearch();
