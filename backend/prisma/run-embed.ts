import { prisma } from '../src/lib/prisma.js';
import { embedContractVersion } from '../src/lib/embeddings.js';

async function generate() {
  const versionId = 'cmreyrkwx000hukas2veniesr'; // let's find the correct version ID (we saw Version 2 ID is cmreykpjy0048vogrrnet7zck)
  const version2Id = 'cmreykpjy0048vogrrnet7zck';
  console.log('Starting embedding for version:', version2Id);
  try {
    await embedContractVersion(version2Id);
    console.log('Embedding finished successfully!');
  } catch (err) {
    console.error('Embedding failed:', err);
  }
}

generate();
