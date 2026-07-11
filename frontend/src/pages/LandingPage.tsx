/**
 * LandingPage — LawyerOS public marketing page.
 *
 * Editorial-luxe aesthetic: deep obsidian + brushed brass, Cormorant
 * Garamond serif display + Inter body. Sections (in order):
 *   1. Nav
 *   2. Hero
 *   3. Trusted-by marquee
 *   4. Core capabilities (bento)
 *   5. Interactive product showcase
 *   6. AI workflow / How it works
 *   7. Security & compliance
 *   8. Testimonials
 *   9. Pricing
 *  10. FAQ
 *  11. CTA
 *  12. Footer
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  FileText,
  Scale,
  Network,
  PenSquare,
  Workflow,
  ShieldCheck,
  Sparkles,
  Building2,
  Lock,
  KeyRound,
  ScrollText,
  ChevronDown,
  Check,
  Quote,
  Menu,
  X,
} from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'

// ─── Motion presets ────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  viewport: { once: true, margin: '-80px' },
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links: Array<{ label: string; href: string }> = [
    { label: 'Product',   href: '#capabilities' },
    { label: 'Workflow',  href: '#workflow' },
    { label: 'Security',  href: '#security' },
    { label: 'Pricing',   href: '#pricing' },
    { label: 'FAQ',       href: '#faq' },
  ]
  return (
    <header
      data-testid="landing-nav"
      className={
        'fixed top-0 inset-x-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ' +
        (scrolled
          ? 'bg-obsidian-900/85 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent border-b border-transparent')
      }
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" aria-label="LawyerOS home" data-testid="landing-logo" className="focus:outline-none">
          <Wordmark size="2xl" />
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="text-[13.5px] text-slate-300 hover:text-white transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 right-0 mx-auto h-px w-0 group-hover:w-full bg-brass-400/70 transition-[width] duration-300" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            data-testid="nav-login"
            className="text-[13.5px] text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            data-testid="nav-register"
            className="btn-brass text-[13px]"
          >
            Request access <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          data-testid="mobile-menu-toggle"
          className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/5"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-obsidian-900/95 backdrop-blur-xl px-6 py-5 space-y-3" data-testid="mobile-menu">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-[15px] text-slate-200 py-1.5">{l.label}</a>
          ))}
          <div className="pt-3 flex flex-col gap-3">
            <Link to="/login" className="btn-ghost-luxe justify-center">Sign in</Link>
            <Link to="/register" className="btn-brass justify-center">Request access</Link>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section
      data-testid="landing-hero"
      className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 hero-aurora grain overflow-hidden"
    >
      {/* Blurred gold orb accent */}
      <div aria-hidden className="absolute top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-brass-400/10 blur-[120px]" />
      <div aria-hidden className="absolute -top-32 right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-900/20 blur-[110px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 text-center">
        <motion.div {...fadeUp}>
          <span className="eyebrow" data-testid="hero-eyebrow">
            The AI operating system for legal
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="headline mt-8 text-white text-[52px] sm:text-[64px] md:text-[84px] lg:text-[104px]"
          data-testid="hero-headline"
        >
          The <span className="headline-italic text-brass-gradient">precision</span> of Big Law.
          <br />
          The <span className="headline-italic text-brass-gradient">speed</span> of AI.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-slate-300 font-light leading-relaxed"
          data-testid="hero-subhead"
        >
          LawyerOS unifies contract lifecycle, AI legal research, negotiation, and e-signature
          into a single, quietly powerful workspace — trusted by modern general counsels and
          the world&apos;s most demanding legal teams.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register" data-testid="hero-primary-cta" className="btn-brass text-[15px] px-8 py-3.5">
            Request early access
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#capabilities" data-testid="hero-secondary-cta" className="btn-ghost-luxe text-[15px] px-8 py-3.5">
            Explore the product
          </a>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.35 }}
          className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brass-400" /> SOC 2 Type II</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brass-400" /> SSO / SAML</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brass-400" /> Attorney-only data</span>
        </motion.div>

        {/* Product screenshot mockup — a stylised app frame */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mt-20 relative"
          data-testid="hero-product-frame"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Reflective floor */}
            <div className="absolute -inset-x-20 -bottom-24 h-40 bg-gradient-to-t from-brass-400/10 via-brass-400/5 to-transparent blur-2xl" />
            <div className="glass-panel-brass overflow-hidden shadow-glow-brass-lg">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6 bg-obsidian-800/50">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-4 text-[11px] text-slate-500 font-mono">app.lawyeros.ai / matters / project-atlas</span>
              </div>
              <div className="grid grid-cols-12 min-h-[380px] md:min-h-[460px]">
                {/* Faux sidebar */}
                <div className="col-span-3 border-r border-white/6 bg-obsidian-900/60 p-4 space-y-1.5 hidden md:block">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Workspace</div>
                  {['Dashboard', 'Matters', 'Contracts', 'Negotiations', 'Research', 'Playbook'].map((it, i) => (
                    <div
                      key={it}
                      className={
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-[12.5px] ' +
                        (i === 1 ? 'bg-brass-400/10 text-brass-300 border border-brass-400/20' : 'text-slate-400')
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {it}
                    </div>
                  ))}
                </div>
                {/* Faux main content */}
                <div className="col-span-12 md:col-span-9 p-6 md:p-8 space-y-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-brass-400 mb-1">Matter · M&amp;A</div>
                    <div className="font-serif text-2xl md:text-3xl tracking-tight text-white">Project Atlas — Series C acquisition</div>
                    <div className="text-[12.5px] text-slate-500 mt-1">4 contracts · 12 obligations · $4.2M ARR at stake</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { l: 'Contracts', v: '48' },
                      { l: 'Obligations', v: '162' },
                      { l: 'Approvals', v: '7', accent: true },
                      { l: 'Renewals', v: '3' },
                    ].map(k => (
                      <div key={k.l} className="rounded-lg border border-white/5 bg-obsidian-800/60 px-4 py-3">
                        <div className="text-[10.5px] uppercase tracking-widest text-slate-500">{k.l}</div>
                        <div className={'font-serif text-xl mt-1 ' + (k.accent ? 'text-brass-400' : 'text-white')}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ['MSA — Zenith Labs, Inc.',       'Under negotiation', 'brass'],
                      ['DPA — Nova Systems Ltd.',       'Awaiting counsel',  'slate'],
                      ['Employment — J. Chen',          'Signed',            'emerald'],
                      ['Vendor SLA — Aegis Cloud',      'Expiring in 21d',   'red'],
                    ].map(([title, status, color], i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          <span className="text-[13px] text-slate-200 truncate">{title}</span>
                        </div>
                        <span
                          className={
                            'text-[10.5px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ' +
                            (color === 'brass' ? 'text-brass-300 border-brass-400/30 bg-brass-400/5' :
                             color === 'emerald' ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5' :
                             color === 'red' ? 'text-rose-400 border-rose-500/25 bg-rose-500/5' :
                             'text-slate-300 border-white/10 bg-white/[0.03]')
                          }
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TrustedBy() {
  const firms = [
    'PALLADIAN & CO.',
    'HARROW · WEST',
    'MERIDIAN LEGAL',
    'ATLAS COUNSEL',
    'BRUNSWICK BAR',
    'HERON & FINCH',
    'IRONCROWN LLP',
    'ROSEWOOD PARTNERS',
  ]
  const doubled = [...firms, ...firms]
  return (
    <section
      data-testid="landing-trustedby"
      className="relative py-14 border-y border-white/5 bg-obsidian-800/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center mb-8">
        <p className="eyebrow justify-center">Trusted by innovative legal teams</p>
      </div>
      <div className="relative">
        <div aria-hidden className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-obsidian-900 to-transparent z-10" />
        <div aria-hidden className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-obsidian-900 to-transparent z-10" />
        <div className="marquee-track">
          {doubled.map((f, i) => (
            <span
              key={i}
              className="mx-10 whitespace-nowrap font-serif text-lg md:text-xl tracking-[0.14em] text-slate-500/80"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function CoreCapabilities() {
  const items = [
    {
      icon: FileText,
      title: 'Contract Lifecycle',
      body: 'Draft, redline, approve, and execute — every clause tracked, every version signed and sealed.',
      big: true,
    },
    { icon: Scale, title: 'AI Legal Research', body: 'Statutory search across Indian Kanoon with citation-grade summaries.' },
    { icon: Network, title: 'Knowledge Graph', body: 'Every party, obligation, and precedent — connected in a queryable graph.' },
    { icon: PenSquare, title: 'E-Signatures', body: 'PAdES-compliant signing with signer portal and audit-grade trails.' },
    { icon: Workflow, title: 'Workflow Automation', body: 'Playbooks that route approvals, renewals, and obligations to the right owner.' },
  ]
  return (
    <section
      id="capabilities"
      data-testid="landing-capabilities"
      className="relative py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div {...fadeUp} className="max-w-2xl">
          <p className="eyebrow">Core capabilities</p>
          <h2 className="headline mt-6 text-4xl md:text-6xl text-white">
            One workspace.<br />
            <span className="headline-italic text-brass-gradient">Every</span> legal workflow.
          </h2>
          <p className="mt-6 text-slate-400 text-lg font-light max-w-xl leading-relaxed">
            From first draft to signed contract, from statute to citation — LawyerOS
            replaces the patchwork of tools that slow legal down.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
          {items.map((it, i) => {
            const span = it.big
              ? 'md:col-span-6 lg:col-span-3 md:row-span-2'
              : (i === 1 ? 'md:col-span-3' : i === 2 ? 'md:col-span-3' : 'md:col-span-3')
            return (
              <motion.div
                key={it.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className={
                  'group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-obsidian-700 to-obsidian-800 p-8 md:p-10 hover:border-brass-400/40 transition-colors ' +
                  span
                }
                data-testid={`capability-${it.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div aria-hidden className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brass-400/[0.06] blur-3xl group-hover:bg-brass-400/[0.12] transition-colors duration-700" />
                <div className="relative z-10">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brass-400/10 border border-brass-400/20 text-brass-300">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <h3 className={'mt-6 headline text-white ' + (it.big ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl')}>
                    {it.title}
                  </h3>
                  <p className={'mt-3 text-slate-400 font-light leading-relaxed ' + (it.big ? 'text-lg max-w-md' : 'text-[15px]')}>
                    {it.body}
                  </p>
                  {it.big && (
                    <div className="mt-8 flex items-center gap-2 text-brass-400 text-sm font-medium">
                      <span>Take the tour</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function InteractiveShowcase() {
  const features = [
    { title: 'Redline with AI', body: 'Track every change against your playbook. Deviations flagged in real time.' },
    { title: 'Ask your contracts', body: 'Natural-language questions across your entire executed portfolio.' },
    { title: 'Render the graph', body: 'See counterparties, obligations, and risk in a living knowledge graph.' },
    { title: 'Ship in one click', body: 'From approval to e-signature to obligation tracking — one continuous flow.' },
  ]
  return (
    <section
      data-testid="landing-showcase"
      className="relative py-24 md:py-32 bg-obsidian-800/40 border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <motion.p {...fadeUp} className="eyebrow">The product, in motion</motion.p>
          <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="headline mt-6 text-4xl md:text-5xl text-white">
            A studio for<br /><span className="headline-italic text-brass-gradient">counsel</span>, not a toolbelt.
          </motion.h2>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-6 text-slate-400 text-lg font-light leading-relaxed max-w-md">
            Every surface in LawyerOS is designed with the deliberate hand of a
            senior associate — quiet, precise, and always deferring to the work.
          </motion.p>
          <motion.ul {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-10 space-y-5">
            {features.map(f => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-1 h-6 w-6 rounded-full border border-brass-400/40 bg-brass-400/10 text-brass-300 inline-flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="text-white font-medium text-[15px]">{f.title}</div>
                  <div className="text-slate-400 text-[14px] mt-0.5 font-light">{f.body}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {[
            {
              tag: 'Redline',
              title: 'Live playbook enforcement',
              body: 'The MSA arrives. AI compares every clause against your firm\u2019s playbook. Deviations surface with citation-grade rationale.',
            },
            {
              tag: 'Research',
              title: 'From statute to citation',
              body: 'Ask the workspace a question. Get a defensible answer with links to Indian Kanoon rulings and internal precedent.',
            },
            {
              tag: 'Graph',
              title: 'The living relationship map',
              body: 'Counterparties, entities, obligations, and matter dependencies — rendered as a knowledge graph you can query.',
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
              className="glass-panel p-8 md:p-10"
            >
              <span className="eyebrow">{s.tag}</span>
              <h3 className="headline mt-4 text-2xl md:text-3xl text-white">{s.title}</h3>
              <p className="mt-3 text-slate-400 font-light leading-relaxed max-w-lg">{s.body}</p>
              <div className="mt-6 rounded-lg border border-white/5 bg-obsidian-900/60 p-4 font-mono text-[12px] text-slate-400 leading-6">
                <span className="text-brass-400">$ lawyeros ask</span>
                <span className="text-slate-500"> &ldquo;risk of this indemnity vs. our playbook?&rdquo;</span>
                <br />
                <span className="text-slate-500">→ </span>
                <span className="text-slate-300">Clause 8.2 exceeds our cap by 3.4×. Precedent M-2024-118 held similar clauses...</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Ingest',    body: 'Upload contracts, connect email, or draft from templates. LawyerOS extracts every clause, party, and obligation.' },
    { n: '02', title: 'Enrich',    body: 'The AI redlines against your playbook, benchmarks value, and flags risk with citation-grade rationale.' },
    { n: '03', title: 'Negotiate', body: 'Collaborative editor, threaded comments, and approval routing keep counsel and counterparty in one thread.' },
    { n: '04', title: 'Execute',   body: 'PAdES-grade e-signatures, sealed audit trails, and automatic filing to your knowledge graph.' },
    { n: '05', title: 'Govern',    body: 'Obligations, renewals, and expirations surface in queues before they become tomorrow\u2019s crisis.' },
  ]
  return (
    <section id="workflow" data-testid="landing-workflow" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <motion.div {...fadeUp} className="max-w-2xl">
          <p className="eyebrow">The AI workflow</p>
          <h2 className="headline mt-6 text-4xl md:text-6xl text-white">
            From <span className="headline-italic text-brass-gradient">first draft</span><br />
            to signed and shelved.
          </h2>
          <p className="mt-6 text-slate-400 text-lg font-light leading-relaxed">
            Five stages, one workspace, zero handoffs. LawyerOS carries the contract
            from the moment it lands to the day it renews.
          </p>
        </motion.div>

        <div className="mt-20 relative">
          {/* Vertical brass timeline */}
          <div aria-hidden className="absolute left-6 md:left-10 top-4 bottom-4 w-px bg-gradient-to-b from-brass-400/60 via-brass-400/20 to-transparent" />
          <ol className="space-y-14">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="relative pl-16 md:pl-24"
              >
                <span className="absolute left-0 md:left-4 top-0 h-12 w-12 md:h-12 md:w-12 rounded-full border border-brass-400/50 bg-obsidian-900 text-brass-400 font-serif text-lg flex items-center justify-center shadow-[0_0_0_6px_rgba(6,9,19,1),0_0_24px_-6px_rgba(212,175,55,0.4)]">
                  {s.n}
                </span>
                <h3 className="headline text-2xl md:text-3xl text-white">{s.title}</h3>
                <p className="mt-2 text-slate-400 font-light max-w-2xl leading-relaxed">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Security() {
  const badges = [
    { icon: ShieldCheck, label: 'SOC 2 Type II' },
    { icon: Lock,        label: 'AES-256 at rest' },
    { icon: KeyRound,    label: 'SSO / SAML 2.0' },
    { icon: ScrollText,  label: 'Immutable audit log' },
    { icon: Building2,   label: 'Data residency' },
    { icon: Sparkles,    label: 'Attorney-only model' },
  ]
  return (
    <section id="security" data-testid="landing-security" className="relative py-24 md:py-32 border-t border-white/5">
      <div aria-hidden className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(212,175,55,0.06) 0%, transparent 40%)' }} />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <p className="eyebrow">Enterprise grade by default</p>
            <h2 className="headline mt-6 text-4xl md:text-5xl text-white">
              Built for<br /><span className="headline-italic text-brass-gradient">counsel</span>. Cleared by security.
            </h2>
            <p className="mt-6 text-slate-400 text-lg font-light leading-relaxed max-w-lg">
              Your privileged communications never leave your control. LawyerOS is
              deployed with the security posture your GC and CISO expect on day zero
              — not on the vendor questionnaire response.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['ABA Model Rule 1.6', 'GDPR', 'SOC 2', 'ISO 27001'].map(b => (
                <span key={b} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brass-400/25 bg-brass-400/5 text-brass-300 text-[12px] font-medium tracking-wide">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="grid grid-cols-2 gap-4">
            {badges.map(b => (
              <div key={b.label} className="glass-panel p-6 hover:border-brass-400/30 transition-colors">
                <b.icon className="h-6 w-6 text-brass-400" />
                <div className="mt-4 text-white font-medium text-[15px]">{b.label}</div>
                <div className="mt-1 text-slate-500 text-[12px] font-mono">verified</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const quotes = [
    {
      quote: 'LawyerOS is the first legal product that respects the seriousness of the work. My deal team ships in half the time — with more precision, not less.',
      name: 'Rohan Mehta',
      role: 'General Counsel, Aegis Cloud',
      img: 'https://images.unsplash.com/photo-1769636929231-3cd7f853d038?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgzNzQyNjQwfDA&ixlib=rb-4.1.0&q=85',
    },
    {
      quote: 'The knowledge graph alone justifies the platform. For the first time, I can ask "who owes us what" and get an actual answer.',
      name: 'Amara Devi',
      role: 'Head of Legal Ops, Palladian & Co.',
      img: 'https://images.pexels.com/photos/31869537/pexels-photo-31869537.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    },
    {
      quote: 'Redlining used to be an evening. Now it\u2019s an espresso. And every deviation is documented against playbook — no more "did we say yes to this?"',
      name: 'James Whitfield',
      role: 'Partner, Harrow · West LLP',
      img: 'https://images.unsplash.com/photo-1758534063829-a72058381e21?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgzNzQyNjQwfDA&ixlib=rb-4.1.0&q=85',
    },
  ]
  return (
    <section data-testid="landing-testimonials" className="relative py-24 md:py-32 bg-obsidian-800/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div {...fadeUp} className="max-w-2xl">
          <p className="eyebrow">Counsel says</p>
          <h2 className="headline mt-6 text-4xl md:text-5xl text-white">
            The teams building modern legal.
          </h2>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <motion.figure
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass-panel p-8 flex flex-col"
              data-testid={`testimonial-${i}`}
            >
              <Quote className="h-6 w-6 text-brass-400" />
              <blockquote className="mt-6 headline text-white text-[22px] leading-[1.35] flex-1">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 pt-6 border-t border-white/5">
                <img
                  src={q.img}
                  alt={q.name}
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-brass-400/30"
                />
                <div>
                  <div className="text-white text-[13.5px] font-medium">{q.name}</div>
                  <div className="text-slate-500 text-[12px]">{q.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = [
    {
      name: 'Practice',
      price: 'From $49',
      unit: 'per seat / month',
      body: 'For solo counsel and boutique practices standardising their contract flow.',
      features: ['Up to 5 seats', 'Core CLM + templates', 'AI redline (10 / mo)', 'Standard SSO', 'Email support'],
      cta: 'Start trial',
      href: '/register',
    },
    {
      name: 'Firm',
      price: 'From $129',
      unit: 'per seat / month',
      body: 'For in-house teams and boutiques that live inside LawyerOS every day.',
      features: ['Up to 50 seats', 'Full CLM + Playbook', 'Unlimited AI redline', 'Knowledge Graph', 'Priority support'],
      cta: 'Talk to us',
      featured: true,
      href: '/register',
    },
    {
      name: 'Enterprise',
      price: 'Bespoke',
      unit: 'per organisation',
      body: 'For general counsels and Big Law firms with the most demanding requirements.',
      features: ['Unlimited seats', 'Dedicated knowledge graph', 'SAML + SCIM', 'Custom data residency', 'Named CSM & DPO'],
      cta: 'Contact sales',
      href: '/register',
    },
  ]
  return (
    <section id="pricing" data-testid="landing-pricing" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
          <p className="eyebrow justify-center">Pricing</p>
          <h2 className="headline mt-6 text-4xl md:text-6xl text-white">Priced for <span className="headline-italic text-brass-gradient">counsel</span>, not seats.</h2>
          <p className="mt-6 text-slate-400 text-lg font-light">Every tier includes SOC 2, SSO, and unlimited AI research. No usage traps.</p>
        </motion.div>
        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className={
                'relative rounded-2xl p-8 md:p-10 border transition-all ' +
                (t.featured
                  ? 'glass-panel-brass border-brass-400/40 shadow-glow-brass scale-100 md:scale-[1.02]'
                  : 'luxe-card bg-obsidian-700')
              }
              data-testid={`pricing-tier-${t.name.toLowerCase()}`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-widest rounded-full bg-brass-gradient text-obsidian-900 shadow-glow-brass">
                  Most popular
                </span>
              )}
              <div className="eyebrow">{t.name}</div>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="headline text-4xl md:text-5xl text-white">{t.price}</span>
                <span className="text-slate-500 text-sm">{t.unit}</span>
              </div>
              <p className="mt-4 text-slate-400 text-[14px] font-light leading-relaxed">{t.body}</p>
              <ul className="mt-8 space-y-3">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-[14px] text-slate-300">
                    <Check className={'h-4 w-4 mt-0.5 shrink-0 ' + (t.featured ? 'text-brass-400' : 'text-slate-400')} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={t.href}
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                className={'mt-10 w-full justify-center ' + (t.featured ? 'btn-brass' : 'btn-ghost-luxe')}
              >
                {t.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const items = [
    { q: 'How is LawyerOS different from a traditional CLM?', a: 'Traditional CLMs are contract databases. LawyerOS is a full legal operating system — from AI-native drafting through obligation tracking — designed by lawyers who understand where a matter lives after signing.' },
    { q: 'Which AI models power the workspace?', a: 'A carefully composed panel of frontier models — including Claude Sonnet, GPT-5 class, and Gemini — routed based on the task. Every prompt is grounded in your workspace, playbook, and citation library.' },
    { q: 'Where is our data stored?', a: 'AES-256 at rest, TLS 1.3 in transit, in the region of your choice (US, EU, or IN). Enterprise customers get dedicated single-tenant deployments and can bring their own key.' },
    { q: 'Do you train on our contracts?', a: 'Never. Your privileged communications are quarantined to your workspace. All AI inference runs under a strict no-training data agreement with our model providers.' },
    { q: 'How long does deployment take?', a: 'A Practice or Firm workspace is live in under 15 minutes. Enterprise SSO + SCIM + data residency deployments typically ship in 2–4 weeks with a named CSM.' },
    { q: 'Is there a free trial?', a: 'Yes — a 30-day trial on the Firm tier with full functionality and up to 10 seats. No credit card required.' },
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" data-testid="landing-faq" className="relative py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <motion.div {...fadeUp}>
          <p className="eyebrow">Frequently asked</p>
          <h2 className="headline mt-6 text-4xl md:text-5xl text-white">
            Questions from<br /><span className="headline-italic text-brass-gradient">thoughtful</span> buyers.
          </h2>
        </motion.div>
        <div className="mt-14 divide-y divide-white/5 border-y border-white/5">
          {items.map((it, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  data-testid={`faq-item-${i}`}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-6 text-left group"
                >
                  <span className={'headline text-white text-xl md:text-2xl transition-colors ' + (isOpen ? '' : 'group-hover:text-brass-300')}>
                    {it.q}
                  </span>
                  <ChevronDown
                    className={
                      'h-5 w-5 shrink-0 text-brass-400 transition-transform duration-300 ' +
                      (isOpen ? 'rotate-180' : '')
                    }
                  />
                </button>
                <div
                  className={
                    'grid transition-[grid-template-rows,opacity] duration-400 ease-out ' +
                    (isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0')
                  }
                >
                  <div className="overflow-hidden">
                    <p className="text-slate-400 font-light leading-relaxed max-w-2xl pb-2">
                      {it.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section data-testid="landing-cta" className="relative py-28 md:py-36 overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass-400/40 to-transparent" />
      <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,55,0.15) 0%, transparent 60%)' }} />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <motion.p {...fadeUp} className="eyebrow justify-center">The AI workspace for modern legal</motion.p>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="headline mt-8 text-5xl md:text-7xl lg:text-8xl text-white">
          Ready to <span className="headline-italic text-brass-gradient">upgrade</span><br />your practice?
        </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-8 text-slate-400 text-lg md:text-xl font-light max-w-xl mx-auto">
          Join the general counsels and modern legal teams building on LawyerOS.
        </motion.p>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" data-testid="cta-primary" className="btn-brass text-[15px] px-8 py-3.5">
            Request early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" data-testid="cta-secondary" className="btn-ghost-luxe text-[15px] px-8 py-3.5">
            Sign in
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  const cols: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
    {
      heading: 'Product',
      links: [
        { label: 'Contract Lifecycle', href: '#capabilities' },
        { label: 'AI Legal Research', href: '#capabilities' },
        { label: 'Knowledge Graph', href: '#capabilities' },
        { label: 'E-Signatures', href: '#capabilities' },
        { label: 'Workflow Automation', href: '#capabilities' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Customers', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Blog', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API', href: '#' },
        { label: 'Playbook Templates', href: '#' },
        { label: 'Security Overview', href: '#security' },
        { label: 'Status', href: '/status' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'DPA', href: '#' },
        { label: 'Sub-processors', href: '#' },
        { label: 'Trust Center', href: '#' },
      ],
    },
  ]
  return (
    <footer data-testid="landing-footer" className="relative pt-20 pb-10 border-t border-white/5 bg-obsidian-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-16">
          <div className="col-span-2 md:col-span-2">
            <Wordmark size="2xl" />
            <p className="mt-5 text-slate-400 text-sm font-light max-w-xs leading-relaxed">
              The AI workspace for modern legal teams. Precision, speed, and gravitas — in a single, quietly powerful surface.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
          </div>
          {cols.map(c => (
            <div key={c.heading}>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-brass-400">{c.heading}</div>
              <ul className="mt-5 space-y-3">
                {c.links.map(l => (
                  <li key={l.label}>
                    {l.href.startsWith('/') ? (
                      <Link to={l.href} className="text-[13.5px] text-slate-400 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-[13.5px] text-slate-400 hover:text-white transition-colors">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hairline" />
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-[12px] text-slate-500">
            © {new Date().getFullYear()} LawyerOS, Inc. — Crafted with quiet precision.
          </div>
          <div className="text-[11px] text-slate-500 font-mono tracking-wider">
            EST · MMXXVI · PALO ALTO · BOMBAY · LONDON
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div data-testid="landing-page" className="bg-obsidian-900 text-white antialiased selection:bg-brass-400/30">
      <NavBar />
      <main>
        <Hero />
        <TrustedBy />
        <CoreCapabilities />
        <InteractiveShowcase />
        <HowItWorks />
        <Security />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
