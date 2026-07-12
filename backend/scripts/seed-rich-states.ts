import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding rich states (Invoices, Diligence Rooms)...')

  // Get the first org
  const org = await prisma.organization.findFirst()
  if (!org) {
    console.log('No organization found. Skipping.')
    return
  }

  const user = await prisma.user.findFirst({ where: { orgId: org.id } })
  if (!user) {
    console.log('No user found. Skipping.')
    return
  }

  // Find a counterparty and contract
  let cp = await prisma.counterparty.findFirst({ where: { orgId: org.id } })
  if (!cp) {
    cp = await prisma.counterparty.create({
      data: { orgId: org.id, name: 'Acme Corporation' }
    })
  }

  let contract = await prisma.contract.findFirst({ where: { orgId: org.id } })
  if (!contract) {
    contract = await prisma.contract.create({
      data: {
        orgId: org.id,
        ownerId: user.id,
        counterpartyId: cp.id,
        title: 'Master Services Agreement - Seeded',
        status: 'EXECUTED',
        type: 'MSA'
      }
    })
  }

  // 1. Seed Invoices
  console.log('Seeding invoices...')
  await prisma.invoice.deleteMany({ where: { orgId: org.id } })
  
  await prisma.invoice.createMany({
    data: [
      {
        orgId: org.id,
        contractId: contract.id,
        vendorName: 'Acme Corporation',
        invoiceNumber: 'INV-2025-001',
        amount: 50000,
        currency: 'USD',
        status: 'PAID',
        invoiceDate: new Date('2025-01-10'),
        dueDate: new Date('2025-02-10'),
      },
      {
        orgId: org.id,
        contractId: contract.id,
        vendorName: 'Acme Corporation',
        invoiceNumber: 'INV-2025-002',
        amount: 75000,
        currency: 'USD',
        status: 'PENDING',
        invoiceDate: new Date('2025-03-01'),
        dueDate: new Date('2025-04-01'),
      },
      {
        orgId: org.id,
        contractId: contract.id,
        vendorName: 'Acme Corporation',
        invoiceNumber: 'INV-2025-003',
        amount: 15000,
        currency: 'USD',
        status: 'DISPUTED',
        invoiceDate: new Date('2025-03-15'),
        dueDate: new Date('2025-04-15'),
        metadata: { disputeReason: 'Services not fully rendered' }
      }
    ]
  })

  // 2. Seed Diligence Rooms
  console.log('Seeding diligence rooms...')
  await prisma.diligenceRoom.deleteMany({ where: { orgId: org.id } })
  
  await prisma.diligenceRoom.createMany({
    data: [
      {
        orgId: org.id,
        name: 'Project Phoenix M&A',
        description: 'Buy-side diligence for acquisition of Phoenix Tech.',
        status: 'ACTIVE',
        targetDate: new Date('2025-12-31'),
      },
      {
        orgId: org.id,
        name: 'Series C Fundraising',
        description: 'Vendor documents and cap table diligence for Series C.',
        status: 'ACTIVE',
        targetDate: new Date('2025-10-15'),
      },
      {
        orgId: org.id,
        name: 'Vendor Compliance Audit',
        description: 'SOC2 and compliance audit for top 10 vendors.',
        status: 'COMPLETED',
      }
    ]
  })

  // 3. Seed some pending/overdue Obligations
  console.log('Seeding obligations...')
  await prisma.obligation.deleteMany({ where: { orgId: org.id } })
  
  await prisma.obligation.createMany({
    data: [
      {
        orgId: org.id,
        contractId: contract.id,
        description: 'Provide annual SOC2 Type II report',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // In 30 days
        assigneeId: user.id
      },
      {
        orgId: org.id,
        contractId: contract.id,
        description: 'Quarterly business review (Q1)',
        status: 'OVERDUE',
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        assigneeId: user.id
      },
      {
        orgId: org.id,
        contractId: contract.id,
        description: 'Kickoff meeting',
        status: 'FULFILLED',
        dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        assigneeId: user.id,
        completedAt: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000)
      }
    ]
  })

  console.log('Done.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
