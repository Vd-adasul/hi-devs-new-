import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function reset() {
  const email = 'admin@demo.com'
  const newPassword = 'admin123'
  const hash = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`User ${email} not found! Seeding...`)
    // Normally it's seeded via seed.ts, but if not we log it
    return
  }

  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash }
  })

  console.log(`Password for ${email} successfully reset to: ${newPassword}`)
}

reset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
