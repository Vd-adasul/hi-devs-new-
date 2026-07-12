import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedOrgDefaults } from '../src/lib/org-seed.js'
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLE_DESCRIPTIONS } from '../src/lib/permissions.js'

const prisma = new PrismaClient()

const DEMO_CONTRACTS = [
  {
    title: 'Acme Corp — Master Services Agreement',
    type: 'MSA', status: 'EXECUTED',
    counterpartyName: 'Acme Corporation',
    value: 250000, currency: 'USD',
    effectiveDate: new Date('2025-01-15'), expiryDate: new Date('2027-01-14'),
    riskScore: 0.2, tags: ['enterprise', 'active'],
    summary: 'MSA governing all professional services engagements with Acme Corporation including SLA, liability caps, and IP ownership.',
    keyTerms: { governingLaw: 'Delaware', liabilityCap: '$500,000', autoRenew: true, noticePeriod: '90 days' },
  },
  {
    title: 'Globex — NDA',
    type: 'NDA', status: 'EXECUTED',
    counterpartyName: 'Globex Industries',
    value: null, currency: 'USD',
    effectiveDate: new Date('2025-03-01'), expiryDate: new Date('2027-03-01'),
    riskScore: 0.1, tags: ['nda', 'active'],
    summary: 'Mutual non-disclosure agreement with Globex Industries for evaluation of a potential partnership.',
    keyTerms: { governingLaw: 'California', confidentiality: true, autoRenew: false, noticePeriod: '30 days' },
  },
  {
    title: 'Initech — Software License Agreement',
    type: 'LICENSE', status: 'APPROVED',
    counterpartyName: 'Initech Solutions',
    value: 48000, currency: 'USD',
    effectiveDate: new Date('2025-06-01'), expiryDate: new Date('2026-05-31'),
    riskScore: 0.35, tags: ['software', 'annual'],
    summary: 'Annual software license for Initech analytics platform covering 50 users with enterprise support tier.',
    keyTerms: { governingLaw: 'Texas', liabilityCap: '$96,000', autoRenew: true, noticePeriod: '60 days' },
  },
  {
    title: 'Umbrella Corp — Vendor Agreement',
    type: 'VENDOR_AGREEMENT', status: 'UNDER_NEGOTIATION',
    counterpartyName: 'Umbrella Corporation',
    value: 120000, currency: 'USD',
    effectiveDate: null, expiryDate: null,
    riskScore: 0.65, tags: ['vendor', 'pending'],
    summary: 'Vendor agreement for cloud infrastructure services. Currently under negotiation on liability clauses and SLA terms.',
    keyTerms: { governingLaw: 'New York', liabilityCap: 'TBD', autoRenew: null, confidentiality: true },
  },
  {
    title: 'Stark Industries — SOW #12',
    type: 'SOW', status: 'EXECUTED',
    counterpartyName: 'Stark Industries',
    value: 85000, currency: 'USD',
    effectiveDate: new Date('2025-02-01'), expiryDate: new Date('2025-08-31'),
    riskScore: 0.15, tags: ['consulting', 'completed'],
    summary: 'Statement of work for Q1-Q2 2025 consulting engagement covering systems integration and staff augmentation.',
    keyTerms: { governingLaw: 'New York', terminationRights: '30-day notice', autoRenew: false },
  },
  {
    title: 'Wayne Enterprises — Partnership Agreement',
    type: 'PARTNERSHIP', status: 'PENDING_APPROVAL',
    counterpartyName: 'Wayne Enterprises',
    value: 500000, currency: 'USD',
    effectiveDate: null, expiryDate: null,
    riskScore: 0.45, tags: ['strategic', 'high-value'],
    summary: 'Strategic partnership agreement for co-development and joint go-to-market of enterprise security solutions.',
    keyTerms: { governingLaw: 'Delaware', confidentiality: true, autoRenew: false, noticePeriod: '180 days' },
  },
  {
    title: 'Pied Piper — SLA',
    type: 'SLA', status: 'EXECUTED',
    counterpartyName: 'Pied Piper Inc.',
    value: 36000, currency: 'USD',
    effectiveDate: new Date('2025-04-01'), expiryDate: new Date('2026-03-31'),
    riskScore: 0.2, tags: ['sla', 'active'],
    summary: 'Service level agreement guaranteeing 99.9% uptime for Pied Piper middleware platform with defined response and resolution times.',
    keyTerms: { governingLaw: 'California', autoRenew: true, noticePeriod: '60 days', liabilityCap: '$72,000' },
  },
  {
    title: 'Dunder Mifflin — Employment Agreement',
    type: 'EMPLOYMENT', status: 'EXECUTED',
    counterpartyName: 'Dunder Mifflin',
    value: 150000, currency: 'USD',
    effectiveDate: new Date('2025-01-01'), expiryDate: null,
    riskScore: 0.1, tags: ['hr', 'active'],
    summary: 'Employment agreement for VP of Sales covering compensation, IP assignment, non-compete, and severance terms.',
    keyTerms: { governingLaw: 'Pennsylvania', noticePeriod: '60 days', confidentiality: true },
  },
  {
    title: 'Veridian Dynamics — Research NDA',
    type: 'NDA', status: 'EXPIRED',
    counterpartyName: 'Veridian Dynamics',
    value: null, currency: 'USD',
    effectiveDate: new Date('2023-06-01'), expiryDate: new Date('2025-06-01'),
    riskScore: 0.05, tags: ['nda', 'expired'],
    summary: 'One-way NDA covering proprietary research shared during technology evaluation. Expired June 2025.',
    keyTerms: { governingLaw: 'California', confidentiality: true, autoRenew: false },
  },
  {
    title: 'Massive Dynamic — Cloud Services MSA',
    type: 'MSA', status: 'DRAFT',
    counterpartyName: 'Massive Dynamic',
    value: 300000, currency: 'USD',
    effectiveDate: null, expiryDate: null,
    riskScore: 0.5, tags: ['cloud', 'draft'],
    summary: 'Draft MSA for managed cloud services engagement. Pending internal legal review before sending to counterparty.',
    keyTerms: { governingLaw: 'New York', liabilityCap: 'TBD', autoRenew: null, confidentiality: true },
  },
]

async function seedBaseData(orgId: string, orgSlug: string, adminId: string) {
  return seedOrgDefaults(orgId, orgSlug, adminId)
}

async function main() {
  console.log('Seeding database...')

  // ── Org ─────────────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: { name: 'Demo Corp', slug: 'demo-corp', subscriptionTier: 'PRO' },
  })

  // ── Roles ────────────────────────────────────────────────────────────────
  const roleNames = ['ADMIN', 'LEGAL_COUNSEL', 'LEGAL_OPS', 'CONTRACT_MANAGER', 'APPROVER', 'VIEWER']
  const roleMap: Record<string, string> = {}

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { orgId_name: { orgId: org.id, name } },
      update: {
        permissions: DEFAULT_ROLE_PERMISSIONS[name] ?? [],
        description: DEFAULT_ROLE_DESCRIPTIONS[name] ?? null,
      },
      create: {
        orgId: org.id,
        name,
        isSystem: true,
        permissions: DEFAULT_ROLE_PERMISSIONS[name] ?? [],
        description: DEFAULT_ROLE_DESCRIPTIONS[name] ?? null,
      },
    })
    roleMap[name] = role.id
  }

  // ── Users ────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      orgId: org.id, email: 'admin@demo.com', passwordHash: hash,
      name: 'Admin User',
      userRoles: { create: { roleId: roleMap['ADMIN'] } },
    },
  })

  await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'legal@demo.com' } },
    update: {},
    create: {
      orgId: org.id, email: 'legal@demo.com', passwordHash: hash,
      name: 'Legal Counsel',
      userRoles: { create: { roleId: roleMap['LEGAL_COUNSEL'] } },
    },
  })

  // ── Counterparties ───────────────────────────────────────────────────────
  const counterpartyNames = [...new Set(DEMO_CONTRACTS.map(c => c.counterpartyName))]
  const cpMap: Record<string, string> = {}

  for (const name of counterpartyNames) {
    const cp = await prisma.counterparty.upsert({
      where: { orgId_name: { orgId: org.id, name } },
      update: {},
      create: { orgId: org.id, name },
    })
    cpMap[name] = cp.id
  }

  // ── Contracts ─────────────────────────────────────────────────────────────
  for (const c of DEMO_CONTRACTS) {
    const existing = await prisma.contract.findFirst({
      where: { orgId: org.id, title: c.title },
    })
    if (existing) continue

    await prisma.contract.create({
      data: {
        orgId: org.id,
        ownerId: admin.id,
        title: c.title,
        type: c.type,
        status: c.status,
        counterpartyId: cpMap[c.counterpartyName],
        counterpartyName: c.counterpartyName,
        value: c.value,
        currency: c.currency,
        effectiveDate: c.effectiveDate,
        expiryDate: c.expiryDate,
        riskScore: c.riskScore,
        summary: c.summary,
        keyTerms: c.keyTerms,
        tags: c.tags,
        versions: {
          create: {
            versionNumber: 1,
            htmlContent: `<h1>${c.title}</h1><p>${c.summary}</p>`,
            plainText: `${c.title}\n\n${c.summary}`,
            changeNote: 'Initial version',
            createdById: admin.id,
          },
        },
      },
    })
  }

  console.log(`✓ Org: ${org.name}`)
  console.log(`✓ Users: admin@demo.com / legal@demo.com  (password: password123)`)
  console.log(`✓ Counterparties: ${counterpartyNames.length}`)
  console.log(`✓ Demo contracts: ${DEMO_CONTRACTS.length}`)

  // ── Seed custom hackathon trial workspace ──────────────────────────────────
  await seedTrialWorkspace()

  // ── Base data (templates, clauses, playbook) for ALL orgs ────────────────
  const allOrgs = await prisma.organization.findMany()
  for (const seedOrg of allOrgs) {
    const seedAdmin = await prisma.user.findFirst({
      where: { orgId: seedOrg.id },
      orderBy: { createdAt: 'asc' },
    })
    if (!seedAdmin) continue
    await seedBaseData(seedOrg.id, seedOrg.slug, seedAdmin.id)
    console.log(`✓ Base data seeded for org: ${seedOrg.name}`)
  }
}

async function seedTrialWorkspace() {
  console.log('Seeding Hackathon Trial Workspace (trial@demo.com / trial1234)...')

  // 1. Create Organization: trial-corp (Acme Technologies Private Limited)
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-tech' },
    update: {},
    create: { name: 'Acme Technologies Private Limited', slug: 'acme-tech', subscriptionTier: 'PRO' },
  })

  // 2. Roles
  const roleNames = ['ADMIN', 'LEGAL_COUNSEL', 'LEGAL_OPS', 'CONTRACT_MANAGER', 'APPROVER', 'VIEWER']
  const roleMap: Record<string, string> = {}
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { orgId_name: { orgId: org.id, name } },
      update: {
        permissions: DEFAULT_ROLE_PERMISSIONS[name] ?? [],
        description: DEFAULT_ROLE_DESCRIPTIONS[name] ?? null,
      },
      create: {
        orgId: org.id,
        name,
        isSystem: true,
        permissions: DEFAULT_ROLE_PERMISSIONS[name] ?? [],
        description: DEFAULT_ROLE_DESCRIPTIONS[name] ?? null,
      },
    })
    roleMap[name] = role.id
  }

  // 3. Users (trial@demo.com, trial-legal@demo.com, trial-cfo@demo.com)
  const hash = await bcrypt.hash('trial1234', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'trial@demo.com' },
    update: {},
    create: {
      orgId: org.id, email: 'trial@demo.com', passwordHash: hash,
      name: 'Trial Admin',
      userRoles: { create: { roleId: roleMap['ADMIN'] } },
    },
  })

  const legalUser = await prisma.user.upsert({
    where: { email: 'trial-legal@demo.com' },
    update: {},
    create: {
      orgId: org.id, email: 'trial-legal@demo.com', passwordHash: hash,
      name: 'Sarah Counsel',
      userRoles: { create: { roleId: roleMap['LEGAL_COUNSEL'] } },
    },
  })

  const cfoUser = await prisma.user.upsert({
    where: { email: 'trial-cfo@demo.com' },
    update: {},
    create: {
      orgId: org.id, email: 'trial-cfo@demo.com', passwordHash: hash,
      name: 'John CFO',
      userRoles: { create: { roleId: roleMap['APPROVER'] } },
    },
  })

  // 4. Counterparty
  const cpGlobex = await prisma.counterparty.upsert({
    where: { orgId_name: { orgId: org.id, name: 'Globex Industries' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Globex Industries',
      legalName: 'Globex Industries Inc.',
      email: 'billing@globex.example.com',
      address: '123 Tech Park, Phase II, Whitefield, Bengaluru, Karnataka 560066',
    },
  })

  // 5. Matter
  const matter = await prisma.matter.create({
    data: {
      orgId: org.id,
      name: 'Project Horizon: Custom Inventory Management',
      description: 'Vendor onboarding, compliance evaluation, and development work milestones for inventory system custom build.',
      status: 'OPEN',
      ownerId: adminUser.id,
      createdById: adminUser.id,
      counterpartyId: cpGlobex.id,
      counterpartyName: cpGlobex.name,
      tags: ['procurement', 'engineering'],
    },
  })

  // 6. WorkflowDefinition
  const workflowDef = await prisma.workflowDefinition.create({
    data: {
      orgId: org.id,
      name: 'High-Value Contract Review',
      description: 'Default validation chain for engineering SOWs and standard agreements exceeding $50k value threshold.',
      isDefault: true,
      isActive: true,
      createdById: adminUser.id,
      triggerRules: { contractTypes: ['SOW', 'MSA'], valueThreshold: 50000 },
      steps: [
        { name: 'Legal Review', roleRequired: 'LEGAL_COUNSEL', order: 0 },
        { name: 'Financial Approval', roleRequired: 'APPROVER', order: 1 },
      ],
    },
  })

  // 7. Seed MSA Contract
  const msaContentHtml = `<h1>MASTER SERVICES AGREEMENT</h1><p>This Master Services Agreement is entered into as of January 1, 2026 by Customer (Acme Technologies Private Limited) and Vendor (Globex Industries).</p><h2>1. TERM AND TERMINATION</h2><p>1.1 Term. Expires on December 31, 2027.</p><p>1.2 Termination for Convenience. Customer can terminate with 15 days notice. Vendor has no reciprocal right.</p><h2>2. CONTRACT VALUE</h2><p>2.2 Contract Value. Total value is $150,000 USD.</p><h2>3. FEES AND PAYMENT TERMS</h2><p>3.2 Payment Terms. Net 30 days from invoice receipt.</p><h2>4. INDEMNIFICATION</h2><p>4.1 Vendor's Indemnity. Vendor shall defend and hold harmless Customer, including all legal fees.</p><h2>5. LIMITATION OF LIABILITY</h2><p>5.1 Vendor's Liability. Vendor's liability under this Agreement shall be unlimited.</p><h2>7. GOVERNING LAW</h2><p>7.1 Governing Law. Governed by the laws of Delaware.</p>`;
  const msaPlainText = `MASTER SERVICES AGREEMENT\n\nJanuary 1, 2026\n\n1.2 Termination for Convenience. Customer can terminate with 15 days notice. Vendor has no reciprocal right.\n\n2.2 Contract Value. $150,000 USD.\n\n3.2 Payment Terms. Net 30 days.\n\n4.1 Vendor's Indemnity. Vendor covers legal fees.\n\n5.1 Vendor's Liability. Unlimited.\n\n7.1 Governing Law. Delaware.`;

  const msaContract = await prisma.contract.create({
    data: {
      orgId: org.id,
      ownerId: adminUser.id,
      title: 'Acme Technologies — Globex Master Services Agreement',
      type: 'MSA',
      status: 'EXECUTED',
      counterpartyId: cpGlobex.id,
      counterpartyName: cpGlobex.name,
      value: 150000,
      currency: 'USD',
      effectiveDate: new Date('2026-01-01'),
      expiryDate: new Date('2027-12-31'),
      jurisdiction: 'Delaware',
      summary: 'Master Services Agreement governing all professional services engagements with Globex Industries including service rates, intellectual property, and unlimited vendor liability.',
      keyTerms: { governingLaw: 'Delaware', liabilityCap: 'Unlimited (Vendor)', paymentTerms: 'Net 30' },
      riskScore: 0.45,
      tags: ['master', 'active'],
      matterId: matter.id,
      versions: {
        create: {
          versionNumber: 1,
          htmlContent: msaContentHtml,
          plainText: msaPlainText,
          changeNote: 'Initial executed agreement',
          createdById: adminUser.id,
        },
      },
    },
  })

  // Get the versionId of the MSA we just created to seed clauses
  const msaVersion = await prisma.contractVersion.findFirst({
    where: { contractId: msaContract.id },
  })

  if (msaVersion) {
    await prisma.contractClause.createMany({
      data: [
        {
          versionId: msaVersion.id,
          clauseType: 'termination',
          content: '1.2 Termination for Convenience. The Customer may terminate this Agreement at any time, for any reason, upon providing fifteen (15) days\' prior written notice to the Vendor. The Vendor shall have no reciprocal right to terminate for convenience.',
          interpretation: 'Customer can terminate freely on 15 days notice. Vendor cannot terminate for convenience. One-sided termination clause.',
          riskRating: 'favorable',
          sectionRef: 'Section 1.2',
          sortOrder: 1,
        },
        {
          versionId: msaVersion.id,
          clauseType: 'payment',
          content: '3.2 Payment Terms. Customer shall pay invoices within Net 30 days from the date of receipt of a valid and undisputed invoice.',
          interpretation: 'Payment terms are Net 30, which aligns with standard operational standards.',
          riskRating: 'neutral',
          sectionRef: 'Section 3.2',
          sortOrder: 2,
        },
        {
          versionId: msaVersion.id,
          clauseType: 'indemnification',
          content: '4.1 Vendor\'s Indemnity. The Vendor shall indemnify, defend, and hold harmless the Customer, its affiliates, directors, officers, employees, and agents from and against any and all claims, demands, suits, causes of action, damages, losses, settlements, penalties, costs, and expenses—expressly including all legal fees, attorneys\' fees, and litigation costs—arising out of or relating to any third-party claim against the Customer.',
          interpretation: 'Vendor holds Customer harmless from all third-party liability including legal fees. Strong customer protective clause.',
          riskRating: 'favorable',
          sectionRef: 'Section 4.1',
          sortOrder: 3,
        },
        {
          versionId: msaVersion.id,
          clauseType: 'limitation_of_liability',
          content: '5.1 Vendor\'s Liability. Notwithstanding anything to the contrary contained in this Agreement or under applicable law, the Vendor\'s liability under this Agreement shall be unlimited. The Vendor shall be liable for all direct, indirect, incidental, special, consequential, and punitive damages arising out of its performance or non-performance under this Agreement.',
          interpretation: 'Vendor has unlimited liability for all damages. Highly favorable to Customer, but extremely high risk for Vendor.',
          riskRating: 'favorable',
          sectionRef: 'Section 5.1',
          sortOrder: 4,
        },
        {
          versionId: msaVersion.id,
          clauseType: 'governing_law',
          content: '7.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of Delaware, without regard to its conflict of laws principles.',
          interpretation: 'Governing law is set to Delaware.',
          riskRating: 'neutral',
          sectionRef: 'Section 7.1',
          sortOrder: 5,
        },
      ],
    })
  }

  // 8. Seed NDA Contract (PENDING_REVIEW)
  const ndaContentHtml = `<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><p>Entered into as of February 1, 2026 between Party A (Acme Technologies Private Limited) and Party B (Globex Industries).</p><h2>4. TERM AND CONFIDENTIALITY DURATION</h2><p>4.1 Term of Agreement. Period shall expire on February 1, 2029.</p><p>4.2 Survival of Obligations. The confidentiality obligations under this Agreement shall remain in force in perpetuity.</p><h2>7. GOVERNING LAW AND JURISDICTION</h2><p>7.1 Governing Law. Governed by the laws of the United Kingdom.</p><p>7.2 Jurisdiction. Subject to the exclusive jurisdiction of the courts of London, United Kingdom.</p>`;
  const ndaPlainText = `MUTUAL NON-DISCLOSURE AGREEMENT\n\nFebruary 1, 2026\n\n4.2 Survival. The confidentiality obligations under this Agreement shall remain in force in perpetuity.\n\n7.1 Governing Law. United Kingdom.\n\n7.2 Jurisdiction. London.`;

  const ndaContract = await prisma.contract.create({
    data: {
      orgId: org.id,
      ownerId: adminUser.id,
      title: 'Acme Technologies — Globex Mutual Non-Disclosure Agreement',
      type: 'NDA',
      status: 'PENDING_REVIEW',
      counterpartyId: cpGlobex.id,
      counterpartyName: cpGlobex.name,
      value: 0,
      currency: 'USD',
      effectiveDate: new Date('2026-02-01'),
      expiryDate: new Date('2029-02-01'),
      jurisdiction: 'United Kingdom',
      summary: 'Mutual Non-Disclosure Agreement between Acme Technologies and Globex Industries for the exchange of confidential business plans and trade secrets during evaluations.',
      keyTerms: { governingLaw: 'United Kingdom', confidentialityDuration: 'Perpetuity' },
      riskScore: 0.65,
      tags: ['nda', 'pending-review'],
      matterId: matter.id,
      versions: {
        create: {
          versionNumber: 1,
          htmlContent: ndaContentHtml,
          plainText: ndaPlainText,
          changeNote: 'Uploaded draft',
          createdById: adminUser.id,
        },
      },
    },
  })

  const ndaVersion = await prisma.contractVersion.findFirst({
    where: { contractId: ndaContract.id },
  })

  if (ndaVersion) {
    await prisma.contractClause.createMany({
      data: [
        {
          versionId: ndaVersion.id,
          clauseType: 'confidentiality',
          content: '4.2 Survival of Obligations. Notwithstanding the expiration or termination of this Agreement, or the conclusion of the discussions regarding the Purpose, the confidentiality obligations under this Agreement shall remain in force in perpetuity. The Receiving Party shall continue to be bound by the restrictions on use and disclosure set forth herein indefinitely.',
          interpretation: 'Confidentiality obligations remain in effect forever. Perpetual term is unusual for standard NDAs which normally sunset in 3-5 years.',
          riskRating: 'unusual',
          sectionRef: 'Section 4.2',
          sortOrder: 1,
        },
        {
          versionId: ndaVersion.id,
          clauseType: 'governing_law',
          content: '7.1 Governing Law. This agreement is governed by the laws of the United Kingdom, without regard to its conflict of laws principles.',
          interpretation: 'Governing law is set to the United Kingdom, which is an out-of-jurisdiction choice for a US entity.',
          riskRating: 'unfavorable',
          sectionRef: 'Section 7.1',
          sortOrder: 2,
        },
      ],
    })
  }

  // 9. Seed SOW No. 1 Contract (PENDING_APPROVAL)
  const sowContentHtml = `<h1>STATEMENT OF WORK NO. 1</h1><p>Entered into as of March 1, 2026 by Acme Technologies Private Limited ("Customer") and Globex Industries ("Vendor").</p><p>Governed by the MSA dated January 1, 2026.</p><h2>2. SERVICES & DELIVERABLES</h2><p>Design and build of a Custom Inventory Management Software System.</p><h2>4. FEES AND MILESTONE PAYMENTS</h2><p>4.1 Contract Value. Value is $50,000 USD.</p><p>4.2 Milestone Payments. Customer shall pay milestones:</p><ul><li>Milestone 1: $20,000 due upon signing.</li><li>Milestone 2: $30,000 due upon User Acceptance Testing.</li></ul><p>4.3 Out-of-Scope Work. Billed at standard rate of $150.00 USD per hour.</p>`;
  const sowPlainText = `STATEMENT OF WORK NO. 1\n\nMarch 1, 2026\n\n4.1 Contract Value: $50,000 USD.\n\n4.2 Milestone Payments: Milestone 1: $20,000 signing / Milestone 2: $30,000 UAT.\n\n4.3 Out-of-Scope Work: $150.00 USD per hour.\n\n4.4 Invoicing: Net 30 days.`;

  const sowContract = await prisma.contract.create({
    data: {
      orgId: org.id,
      ownerId: adminUser.id,
      title: 'Acme Technologies — Globex SOW No. 1 (Custom Inventory Management)',
      type: 'SOW',
      status: 'PENDING_APPROVAL',
      counterpartyId: cpGlobex.id,
      counterpartyName: cpGlobex.name,
      value: 50000,
      currency: 'USD',
      effectiveDate: new Date('2026-03-01'),
      expiryDate: new Date('2026-05-24'),
      jurisdiction: 'Delaware',
      summary: 'Statement of Work No. 1 for the Custom Inventory Management Software System build. Specifies milestone payments, timeline, and deliverables.',
      keyTerms: { milestonePayments: '$20,000 signing / $30,000 UAT', hourlyRate: '$150/hr' },
      riskScore: 0.15,
      tags: ['statement-of-work', 'engineering'],
      matterId: matter.id,
      versions: {
        create: {
          versionNumber: 1,
          htmlContent: sowContentHtml,
          plainText: sowPlainText,
          changeNote: 'SOW Submitted for internal approval',
          createdById: adminUser.id,
        },
      },
    },
  })

  const sowVersion = await prisma.contractVersion.findFirst({
    where: { contractId: sowContract.id },
  })

  if (sowVersion) {
    await prisma.contractClause.createMany({
      data: [
        {
          versionId: sowVersion.id,
          clauseType: 'payment',
          content: '4.2 Milestone Payments. The Customer shall pay the Contract Value to the Vendor in accordance with the following milestone schedule: Milestone 1: $20,000 due upon signing of this SOW (Advance Payment). Milestone 2: $30,000 due upon User Acceptance Testing (UAT) sign-off by the Customer.',
          interpretation: 'Milestone structure: $20k advance at signing and $30k final payment after customer signs off on UAT.',
          riskRating: 'neutral',
          sectionRef: 'Section 4.2',
          sortOrder: 1,
        },
        {
          versionId: sowVersion.id,
          clauseType: 'payment',
          content: '4.3 Out-of-Scope Work (Hourly Rates). Any additional services requested by the Customer that fall outside the scope of the Deliverables defined in Section 2 shall be subject to a separate change order and billed at the Vendor\'s standard blended hourly rate of $150.00 USD per hour.',
          interpretation: 'Out of scope hourly billable rate is set to $150/hour, subject to written change orders.',
          riskRating: 'neutral',
          sectionRef: 'Section 4.3',
          sortOrder: 2,
        },
      ],
    })
  }

  // 10. Seed active ApprovalInstance & ApprovalSteps on SOW No. 1
  const approvalInstance = await prisma.approvalInstance.create({
    data: {
      orgId: org.id,
      contractId: sowContract.id,
      workflowDefinitionId: workflowDef.id,
      status: 'PENDING',
      currentStepOrder: 0,
      submittedById: adminUser.id,
      aiSummary: 'This SOW covers the Custom Inventory Management system build. Contains normal pricing terms but relies on Parent MSA terms. Review for alignment on engineering scopes.',
      keyRisks: [
        { title: 'Standard Milestone Trigger', description: 'UAT payment of $30k requires sign-off, check UAT period limits.', severity: 'low' },
      ],
      nonStandardTerms: [],
      approvalRecommendation: 'review_required',
    },
  })

  await prisma.approvalStep.createMany({
    data: [
      {
        approvalInstanceId: approvalInstance.id,
        orgId: org.id,
        stepOrder: 0,
        stepName: 'Legal Review',
        approverId: legalUser.id,
        status: 'PENDING',
      },
      {
        approvalInstanceId: approvalInstance.id,
        orgId: org.id,
        stepOrder: 1,
        stepName: 'Financial Approval',
        approverId: cfoUser.id,
        status: 'PENDING',
      },
    ],
  })

  // 11. Create Obligations for MSA & SOW
  const ob1 = await prisma.obligation.create({
    data: {
      orgId: org.id,
      contractId: msaContract.id,
      type: 'payment',
      description: 'Phase 1 Deliverables: Software Architecture and Design (As per SOW No. 01 milestone schedule)',
      owner: 'customer',
      dueDate: new Date('2026-08-11'), // Net 30 from invoice July 12
      recurrence: 'one-time',
      trigger: 'Upon delivery of Phase 1 software architecture and design document',
      quote: 'Milestone 1: $20,000 due upon signing',
      severity: 'medium',
      sectionRef: 'Section 4.2',
      status: 'OPEN',
    },
  })

  const ob2 = await prisma.obligation.create({
    data: {
      orgId: org.id,
      contractId: msaContract.id,
      type: 'payment',
      description: 'Phase 2 Deliverables: Backend API Integration (As per SOW No. 02)',
      owner: 'customer',
      dueDate: new Date('2026-08-11'),
      recurrence: 'one-time',
      trigger: 'Upon completion of Phase 2 backend API integrations',
      quote: 'Milestone 2: $30,000 due upon UAT',
      severity: 'medium',
      sectionRef: 'Section 4.2',
      status: 'OPEN',
    },
  })

  // 12. Create Invoices (Matching Demo)
  // Invoice 1 (Perfect Match) -> linked to ob1
  await prisma.invoice.create({
    data: {
      orgId: org.id,
      contractId: msaContract.id,
      matchedObligationId: ob1.id,
      matchScore: 0.95,
      vendorName: 'Globex Industries',
      invoiceNumber: 'INV-2026-1042',
      amount: 10000.00,
      invoiceDate: new Date('2026-07-12'),
      dueDate: new Date('2026-08-11'),
      description: 'Phase 1 Deliverables: Software Architecture and Design (As per SOW No. 01 milestone schedule)',
      status: 'MATCHED',
      createdById: adminUser.id,
    },
  })

  // Invoice 2 (Disputed) -> linked to ob2 but marked DISPUTED
  await prisma.invoice.create({
    data: {
      orgId: org.id,
      contractId: msaContract.id,
      matchedObligationId: ob2.id,
      matchScore: 0.82,
      vendorName: 'Globex Industries',
      invoiceNumber: 'INV-2026-1043',
      amount: 12500.00,
      invoiceDate: new Date('2026-07-12'),
      dueDate: new Date('2026-08-11'),
      description: 'Phase 2 Deliverables: Backend API Integration (As per SOW No. 02) + Additional Engineering Hours (Out of Scope / Expedited Delivery)',
      status: 'DISPUTED',
      disputeReason: 'Amount Mismatch & Unauthorized Overage System Analysis: The vendor (Globex Industries) matches the counterparty on the Master Services Agreement. However, the total invoice amount ($12,500.00) exceeds the fixed-fee cap of $10,000.00 stipulated in SOW No. 02. Nature of Discrepancy: The invoice includes a line item for "$2,500.00 - Additional Engineering Hours" which was not pre-approved under Section 4.2 of the governing MSA.',
      createdById: adminUser.id,
    },
  })

  console.log('✓ Trial organization seeded: Acme Technologies')
  console.log('✓ Trial Users: trial@demo.com, trial-legal@demo.com, trial-cfo@demo.com (password: trial1234)')
  console.log('✓ Trial Contracts: SOW No. 1, MSA, NDA')
  console.log('✓ Trial Matter: Project Horizon')
  console.log('✓ Trial Workflow: High-Value Contract Review (active)')
  console.log('✓ Trial Invoices: INV-2026-1042 (MATCHED) & INV-2026-1043 (DISPUTED)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

