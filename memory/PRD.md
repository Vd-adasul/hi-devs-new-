# lawOS — Marketing Landing Page (PRD)

## Original Problem
Public-facing, award-worthy landing page for lawOS (Enterprise Legal AI / Contract
Intelligence Platform). Premium, minimal, enterprise aesthetic. Kinetic hero, restrained
purposeful motion (Framer Motion + Lenis smooth scroll), accurate feature representation.

## Personas
- General Counsel / Legal Ops leaders evaluating contract intelligence tooling.
- Compliance / procurement stakeholders assessing risk & renewals.

## Architecture
- Frontend: React 19 + Tailwind, Framer Motion, Lenis, react-fast-marquee, shadcn/ui.
  Fonts: Playfair Display (serif headings) + Manrope (body). Theme: bone-white/ink/signal-blue.
- Backend: FastAPI + MongoDB. Public waitlist endpoint.

## Implemented (2026)
- Sections: Navbar, kinetic Hero (masked line reveal + parallax + animated product preview),
  Trusted-by marquee, numbered Problem/Manifesto (sticky), Solution bento (10 features),
  interactive 7-step Product Demo, dark AI Architecture (self-drawing SVG line), Testimonials,
  Pricing (3 cards), FAQ accordion, functional Waitlist form, big-CTA Footer.
- Backend: POST/GET /api/waitlist persisting to `waitlist` collection.
- Knowledge Graph & Ask AI clearly labelled "Upcoming".
- Tested: backend 4/4, frontend flows pass. Reduced-motion respected.

## Backlog
- P1: Server-side email validation (pydantic EmailStr) + basic rate limiting on /api/waitlist.
- P2: Analytics/consent, real customer logos, blog/resources routes.
- P2: Add data-testid="demo-panel" for tighter test hooks.
