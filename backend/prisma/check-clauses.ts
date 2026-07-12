import { prisma } from '../src/lib/prisma.js';

async function check() {
  const contractId = 'cmreyjztn003qvogracgxndi0';
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      versions: {
        include: {
          clauses: true
        }
      }
    }
  });

  if (!contract) {
    console.log('Contract not found');
    return;
  }

  console.log('Contract Title:', contract.title);
  console.log('Analysis Status:', contract.analysisStatus);
  console.log('Analysis Error:', contract.analysisError);
  console.log('Versions Count:', contract.versions.length);
  for (const v of contract.versions) {
    console.log(`Version ${v.versionNumber} ID ${v.id} has ${v.clauses.length} clauses`);
  }
}

check();
