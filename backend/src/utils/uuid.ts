import crypto from 'crypto';

export function objectIdToUuid(id: string): string {
  // Generate a deterministic UUID from any input string using MD5
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32)
  ].join('-');
}

