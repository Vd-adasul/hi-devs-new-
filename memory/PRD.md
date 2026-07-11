# LawyerOS — Product Requirements Document

## Original Problem Statement
> "please add premium looking landing page and then take a look at the repo and change the ui to give a premium look ok"

Follow-up user direction:
- **Visual direction**: Editorial luxe — deep obsidian/navy backgrounds, brass/gold accents used sparingly, elegant serif display font (Cormorant Garamond) for headings, clean sans-serif (Inter) for body. "Big Law meets modern AI" aesthetic.
- **UI redesign scope**: Landing page + auth (login/register) + main dashboard shell.
- **Brand**: LawyerOS.
- **Landing sections**: Hero, Trusted-by, Core capabilities, Interactive product showcase, AI workflow / How it works, Security & compliance, Testimonials, Pricing, FAQ, CTA, Footer.

## Product
**LawyerOS** is an AI-native legal operating system for modern legal teams (in-house GCs, boutique firms, Big Law). It unifies contract lifecycle management, AI legal research (Indian Kanoon), knowledge graph, e-signatures, and workflow automation into a single, quietly powerful surface.

### Existing platform features (pre-redesign, preserved)
- Full CLM: Contracts, Templates, Clauses, Playbook, Matters, Negotiations, Approvals, Review Queue, Obligations, Renewals, Counterparties, Requests.
- AI: Mastra agent, Assistant page (`/agent`), collaborative Tiptap editor with Yjs/Hocuspocus.
- Research: Indian Kanoon statutory research, Neo4j knowledge graph.
- E-signatures: PAdES-compliant signing, signer portal, audit trails.
- Enterprise: SSO stubs (Google/Microsoft/SAML), RBAC, admin (users/roles/org/integrations/skills), audit log, invoicing, analytics.
- Tech: React 19 + Vite + TS + Tailwind + Radix UI (frontend), Fastify + Prisma + TS (backend).

## Personas
1. **General Counsel** — needs risk visibility, obligation tracking, board-ready analytics.
2. **In-house Legal Counsel** — daily driver: contracts, redlines, approvals, negotiations.
3. **Legal Ops** — workflow automation, playbooks, org-wide dashboards, admin.
4. **Big Law Associate/Partner** — statutory research, matter management, diligence.
5. **External Signer / Counterparty** — signer portal (limited surface).

## Design system — Editorial Luxe (implemented 2026-01-11)
- **Palette**: Obsidian scale (900/#060913 background → 700/#0D1322 card) + brass scale (400/#D4AF37 accent, gradient to 500/#B5955C).
- **Typography**: Cormorant Garamond (display serif, italic for accent words) + Inter (body) + JetBrains Mono (data/code).
- **Tokens**: All semantic colors (background, card, primary, muted, ring…) piped through HSL CSS variables in `src/index.css`. Brass focus ring universal.
- **Components**: `.btn-brass`, `.btn-ghost-luxe`, `.glass-panel`, `.glass-panel-brass`, `.luxe-card`, `.eyebrow`, `.headline`, `.headline-italic`, `.text-brass-gradient`, `.hero-aurora`, `.grain`, `.marquee-track`, `.rule-brass`, `.hairline`.
- **Motion**: Framer Motion for section fade-ups; keyframes for marquee, shimmer, pulse-brass.
- **Guidelines file**: `/app/design_guidelines.json`.

## What's been implemented (2026-01-11)

### Landing page (`/`) — NEW
`src/pages/LandingPage.tsx` (public, no auth) — full editorial luxe marketing page with:
1. **Nav** — fixed with scroll-glass transition, anchor links, brass CTA.
2. **Hero** — "The *precision* of Big Law. The *speed* of AI." Massive Cormorant Garamond with brass gradient italic accents. SOC 2 / SSO / attorney-only trust chips. Product mockup with reflective glow.
3. **Trusted-by** — infinite marquee of 8 legal firms in serif capitals.
4. **Core capabilities** — 5-card bento grid (Contract Lifecycle big card + 4 supporting).
5. **Interactive showcase** — sticky-left text, scrolling right showcase panels (Redline, Research, Graph) with mono code snippets.
6. **How it works** — vertical brass timeline (Ingest → Enrich → Negotiate → Execute → Govern).
7. **Security & compliance** — SOC 2, AES-256, SSO/SAML, immutable audit, data residency, attorney-only model + ABA/GDPR/SOC 2/ISO 27001 pills.
8. **Testimonials** — 3 glass panel quote cards with editorial serif quotes.
9. **Pricing** — Practice / Firm (featured, brass) / Enterprise tiers.
10. **FAQ** — expandable accordion, 6 questions, editorial styling.
11. **CTA** — "Ready to *upgrade* your practice?" oversized.
12. **Footer** — 5-column with product/company/resources/legal links, uptime pill, editorial mono strapline.

### Auth redesign
- `LoginPage.tsx` — split-screen luxe. Left: architectural night image + "Welcome back to *LawyerOS*" editorial marquee. Right: glass-panel auth card with SSO buttons (Google/Microsoft/SAML), email/password, forgot-password dialog. All existing testids preserved (login-form, login-email, login-password, login-submit, sso-google, sso-microsoft, sso-saml, forgot-password-link/dialog/email/submit/close/error).
- `RegisterPage.tsx` — split-screen (form left, marquee right). Preserves strength bar, confirm-password validation, terms checkbox. All testids preserved (register-form/org/name/email/password/submit, confirm-password, password-strength, terms-checkbox).

### App shell redesign
- `AppShell.tsx` — obsidian background.
- `Sidebar.tsx` — obsidian-950 sidebar with brass section headers (Workspace, Queues, Post-signature, Library, Insights, Admin), brass-highlighted active state, brass count badges, LawyerOS wordmark. All existing nav-* testids preserved. Collapse via ⌘\.
- `Header.tsx` — glass topbar with global search (⌘/), notification bell, brass gradient user avatar, user menu dropdown. Testids: global-search-trigger, user-menu-*, sidebar-collapse-toggle.
- `Breadcrumbs.tsx` — subtle obsidian breadcrumb bar with brass hover.
- `Wordmark.tsx` — "Lawyer" (slate italic) + "OS" (brass gradient) — editorial luxe. `kind="mark"` for collapsed shows "L·OS".

### Dashboard redesign (`DashboardPage.tsx`)
- Editorial greeting: eyebrow "GOOD DAY, COUNSEL" + massive "Welcome back, *{name}*" serif with brass italic first name + today's date column-right.
- Quick actions: brass primary "Upload Contract", ghost-luxe "New Request" and "View Approvals".
- KPI cards (`luxe-card`): serif number tabular-nums, editorial small caps label, subtle colored icon badges (sky/brass/emerald/rose), brass hover arrow.
- "Your day" band: brass/sky/rose/gray dark chips replacing pastel light ones.
- Recent activity: dark-mode actor avatars (colored ring on obsidian), monospace timestamps.
- YourDayList sub-cards: dark obsidian shell with brass/rose/sky header accents.
- All logic + testids preserved (dashboard-kpi-cards, kpi-card-*, kpi-value-*, dashboard-quick-actions, quick-*, your-day-band, your-day-chip-*, your-day-list-*, your-day-row-*, activity-empty-*).

### Theme foundation
- `tailwind.config.js` — obsidian & brass scales, `font-serif`, `font-sans`, `font-mono`, `boxShadow.glow-brass*`, `backgroundImage.brass-gradient`, keyframes (fadeUp, marquee, shimmer).
- `src/index.css` — full editorial luxe layer: CSS variables, base typography, .btn-brass / .btn-ghost-luxe / .glass-panel* / .luxe-card / .eyebrow / .headline* / .rule-brass / .hero-aurora / .grain / .marquee-track / .hairline.
- `index.html` — Google Fonts (Cormorant Garamond + Inter + JetBrains Mono), title updated to tagline.

### Package + supervisor
- Added `framer-motion` dependency.
- Added `"start"` script to `frontend/package.json` (points to `vite --host 0.0.0.0 --port 3000 --strictPort`) so supervisor's `yarn start` command works.

### Routing (`App.tsx`)
- `/` → **LandingPage** (public marketing).
- `/login`, `/register`, `/privacy`, `/terms`, `/status` → public.
- `/portal/:token`, `/sign/:token` → public portals.
- All other paths → gated `AppShell` (dashboard, matters, contracts, agent, etc.).

## Backlog / Not yet done
- P1 — Extend editorial luxe theme to remaining ~35 inner pages (contracts list/detail, matters, negotiations, obligations, playbook, templates, clauses, research, admin, analytics, diligence, signatures, etc.). Semantic tokens already flow through so most pages will read correctly on dark, but bespoke color choices (badge colors, chart palettes, empty-states) need per-page polish.
- P1 — Backend (Fastify + Prisma) is not currently runnable in this preview pod (supervisor is configured for a Python uvicorn backend); dashboard KPIs will show loading spinner without a live backend. Not required for design deliverable.
- P2 — Real product screenshot in hero (replace the illustrative mockup) once a canonical dashboard view is settled.
- P2 — Add landing analytics (page views, CTA clicks) and A/B test slots.
- P2 — Marketing copy pass by a legal-native copywriter.

## Testing status
- Manual visual verification via screenshot tool across: `/` (all 12 sections), `/login`, `/register`, `/dashboard` (with seeded auth token).
- Lint: `oxlint` clean across all modified/new files.
- Backend integration not tested (backend not runnable in current pod).
- Automated E2E not run.

## Next Action Items
1. Extend editorial luxe theme to Contracts, Matters, Negotiations, and other high-traffic inner pages (phase-by-phase).
2. Wire up the Fastify backend supervisor entry so dashboard KPIs render live.
3. Replace hero mockup with a live dashboard screenshot once inner pages are re-themed.
4. Consider adding a public "Product tour" interactive page for high-intent visitors.
