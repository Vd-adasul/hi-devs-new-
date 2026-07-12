import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { redis } from '../src/lib/redis.js'

async function run() {
  console.log('Testing auth logic connection...');
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'trial@demo.com' },
      include: { userRoles: { include: { role: true } } },
    });
    console.log('User found:', !!user);
    if (user) {
      console.log('User status:', user.status);
      console.log('User roles:', user.userRoles.map(ur => ur.role.name));
      const passwordMatch = await bcrypt.compare('trial1234', user.passwordHash);
      console.log('Password match:', passwordMatch);
    }
  } catch (err) {
    console.error('Prisma query failed:', err);
  }

  try {
    console.log('Testing Redis connection...');
    await redis.ping();
    console.log('Redis ping successful!');
    const key = `login-attempt:trial@demo.com`;
    const count = await redis.incr(key);
    console.log('Redis incr count:', count);
  } catch (err) {
    console.error('Redis failed:', err);
  }
  
  process.exit(0);
}

run();
