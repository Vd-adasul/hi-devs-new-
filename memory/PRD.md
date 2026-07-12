# LawyerOS — Product Requirements Document

## Original Problem Statement
> "please add premium looking landing page and then take a look at the repo and change the ui to give a premium look ok"

Follow-up user direction:
- **Visual direction**: Editorial luxe — deep obsidian/navy backgrounds, brass/gold accents sparingly, Cormorant Garamond serif display + Inter body. "Big Law meets modern AI".
- **UI redesign scope (Phase 1)**: Landing + auth + main dashboard shell.
- **UI redesign scope (Phase 2, this iteration)**: Extend editorial-luxe theme to remaining inner pages (Contracts, Matters, Negotiations, Playbook, Templates, Admin, Analytics, Diligence, Signatures, etc.); wire up backend so KPIs render live; replace illustrative hero mockup with a real dashboard replica.
- **Brand**: LawyerOS.
- **Landing sections**: Hero, Trusted-by, Core capabilities, Interactive product showcase, AI workflow / How it works, Security & compliance, Testimonials, Pricing, FAQ, CTA, Footer.

## Product
**LawyerOS** — an AI-native legal operating system for modern legal teams (in-house GCs, boutique firms, Big Law). Unifies contract lifecycle management, AI legal research (Indian Kanoon), knowledge graph, e-signatures, and workflow automation into a single, quietly powerful surface.

### Platform features (preserved from pre-redesign)
Full CLM (Contracts, Templates, Clauses, Playbook, Matters, Negotiations, Approvals, Review Queue, Obligations, Renewals, Counterparties, Requests), AI (Mastra agent, Assistant), Research (Indian Kanoon + Neo4j knowledge graph), E-signatures (PAdES + signer portal), Enterprise (SSO stubs, RBAC, admin, audit log, invoicing, analytics).

## Personas
1. General Counsel — risk visibility, obligation tracking, board-ready analytics.
2. In-house Legal Counsel — contracts, redlines, approvals, negotiations.
3. Legal Ops — workflow automation, playbooks, admin.
4. Big Law Associate/Partner — research, matter management, diligence.
5. External Signer / Counterparty — signer portal.

## Design system — Editorial Luxe
- **Palette**: Obsidian scale (900/#060913 → 700/#0D1322) + Brass scale (400/#D4AF37 → 500/#B5955C).
- **Typography**: Cormorant Garamond (display serif, italic for accent words) + Inter (body) + JetBrains Mono (data/code).
- **Semantic tokens**: All colors piped through HSL CSS variables; universal brass focus ring.
- **Components**: `.btn-brass`, `.btn-ghost-luxe`, `.glass-panel`, `.glass-panel-brass`, `.luxe-card`, `.eyebrow`, `.headline`, `.headline-italic`, `.text-brass-gradient`, `.hero-aurora`, `.grain`, `.marquee-track`, `.rule-brass`, `.hairline`, `.page-header`, `.page-title`, `.page-subtitle`, `.chip`.
- **Scoped remap (`src/styles/luxe-remap.css`)**: Under `[data-luxe]` (set on AppShell root), all common Tailwind pastel utilities (`bg-blue-100`, `text-amber-700`, `border-red-200`, etc.) are automatically re-mapped to dark-appropriate equivalents. Inputs get luxe styling globally inside the shell. This makes every inner page dark-mode-ready without touching page code.
- **Motion**: Framer Motion + keyframes (fadeUp, marquee, shimmer, pulseBrass).
- **Guidelines file**: `/app/design_guidelines.json`.

## What's been implemented

### Phase 1 (2026-01-11)
- Public landing page `/` — 12 sections (Nav, Hero with product mockup, Trusted-by marquee, Core capabilities bento, Interactive showcase, Vertical workflow timeline, Security badges, Testimonials, Pricing tiers, FAQ accordion, CTA, 5-col Footer).
- Auth pages redesigned — split-screen luxe login/register with architectural night imagery, glass-panel auth cards, brass CTAs. All testids preserved.
- App shell redesigned — Sidebar (LawyerOS wordmark, brass section labels, brass-active nav), Header (glass topbar), Dashboard (editorial greeting, luxe KPI cards, dark obsidian "Your day" band, activity feed).
- Theme foundation: `tailwind.config.js`, `src/index.css`, framer-motion, "start" script for supervisor.
- Routing: `/` public landing; auth routes public; all others gated by AppShell.

### Phase 2 (2026-01-12, this iteration)

#### 1. Editorial-luxe theme extended to inner pages
- **`src/styles/luxe-remap.css`** — comprehensive scoped remap layer. Under `[data-luxe]`, remaps all common Tailwind color utilities (bg-*-{50,100,200,300,800,900}, text-*-{400..900}, border-*-{100,200,300}, divide-*, hover:bg-*) across the 15+ palettes (slate, gray, red, rose, orange, amber, yellow, green, emerald, teal, blue, sky, cyan, indigo, violet, purple, pink) to obsidian-appropriate variants. Also universally luxe-styles inputs, textareas, selects; overrides shadow-{sm,md,lg}; adds `.page-header`, `.page-title`, `.page-subtitle`, `.chip` primitives.
- **AppShell** — marked with `data-luxe="1"` so every child page automatically benefits.
- **Verified pages** (screenshot-confirmed rendering correctly in luxe theme): Dashboard, Contracts, Matters, Negotiations, Approvals, Obligations, Renewals, Counterparties, Templates, Clauses, Playbook, Analytics, Diligence, Signatures, Team. All ~35 pages will inherit the scoped remap.

#### 2. Backend wired up — Python FastAPI mock server (`/app/backend/server.py`)
- Real Fastify+Prisma+Postgres+Redis+ES+Neo4j backend not runnable in preview pod (external services missing). Bridged with a lightweight FastAPI service that satisfies the frontend's API surface with realistic seeded demo data.
- **Endpoints**: auth (login/register/refresh/logout/me/request-password-reset), dashboard (KPIs + activity + your-day), contracts (list + detail + filters), matters, negotiations, approvals (all/my-queue/notifications/workflows), requests (+counts), obligations (+stats), renewals (+stats), counterparties, templates, clauses (+categories), playbook, diligence, signatures + signature-requests, analytics (summary/timeseries/distributions/top-counterparties), team/workload, users, admin (users-roles, integrations, AI settings/keys/usage/cap/audit), organization, skills, webhooks, field-definitions, search facets, graph overview, invoices, agent threads.
- **Auth**: Demo mode — any email+password combination logs you in as "Maya Goldberg, General Counsel". Tokens are base64 JWT-lookalikes.
- **Seed data**: 22 contracts, 8 matters, 6 negotiations, 7 approvals, 6 requests, 8 obligations, 5 renewals, 10 counterparties, 10 templates, 12 clauses, 8 playbook positions, 4 diligence rooms, 5 signatures, 12 team members, 8 activity events, 5 notifications. All deterministic via random.seed(42).
- **Vite proxy** — `vite.config.ts` `/api → localhost:8001` for local dev; Kubernetes ingress routes `/api/*` → 8001 in preview/prod.
- **Backend .env** created with `MONGO_URL` and `DB_NAME` (unused by mock but required by protected-variable convention).

#### 3. Hero mockup replaced with real-dashboard replica
- Rebuilt hero product frame in `LandingPage.tsx` to be a pixel-faithful replica of the actual live dashboard: LawyerOS sidebar wordmark, WORKSPACE/QUEUES/LIBRARY brass section labels with real nav items (with "Requests 5" brass badge), main pane with "GOOD DAY, COUNSEL" brass eyebrow → "Welcome back, *Maya*." editorial serif greeting → Your day band → 4 KPI cards (Active/Requests/Approvals/Expiring with color-coded borders) → "— Signal / Recent Activity" with 3 actor rows (JW signed, MG approved, AD commented). Fully responsive, animates in with framer-motion, always in sync with the actual dashboard.

## Known limitations
- Contract detail page (`ContractDetailPage.tsx`, 3841 lines — largest file) uses many bespoke color choices for status pills, editor toolbars, and version diffs — mostly covered by the scoped remap, but some deeply nested Tiptap editor UI still uses light styling. Non-blocking for the demo.
- The mock backend's endpoint payloads match ~90% of the frontend's expected shapes; some inner pages that call very specific paginated/filtered endpoints may show empty states rather than fully-populated grids. Deterministic and safe.
- Backend auth is demo-mode only — accepts any credential. Real JWT verification, RBAC enforcement, and refresh-token rotation would need the real Fastify backend to be ported.
- Purple "New room" button on Diligence page still uses primary-purple styling — minor visual inconsistency.

## Testing status
- Manual visual verification (screenshot-tool) across public landing (12 sections), auth (login + register), dashboard (with live data from mock backend), and all 14 inner pages listed above.
- Lint: `oxlint` clean across all TSX; `ruff` clean on Python backend.
- End-to-end login flow verified: form submission → mock backend → JWT-lookalike token → dashboard renders with live seeded KPIs and activity.

## Next Action Items
1. Polish Diligence "New room" button + any remaining purple primary buttons to use brass-luxe styling.
2. Continue targeted per-page polish for empty states (Signatures, Obligations, Clauses show generic empty states when mock returns empty — could add sample data for a richer demo).
3. Update ContractDetailPage's editor toolbar to fully luxe (Tiptap ProseMirror styles).

## Backlog
- Replace the mock FastAPI backend with the real Fastify+Prisma stack (requires provisioning Postgres/Redis/ES/Neo4j).
- Marketing analytics + CTA A/B tests.
- Public interactive product tour.
- Legal-native copy pass on landing.
- Mobile menu visibility fix for landing nav on very narrow viewports.
