import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import {
  FileText, ClipboardList, CheckSquare, AlertCircle,
  Upload, Plus, ArrowRight, Loader2, CircleCheckBig, FileEdit, Clock,
  MessageSquareWarning, Repeat, AlertTriangle, Building2,
} from 'lucide-react'
import { toast } from '@/components/common/Toaster'

import { UploadModal } from '@/components/contracts/UploadModal'
import { NewRequestModal } from '@/components/requests/NewRequestModal'
import { WelcomeChecklist } from '@/components/onboarding/WelcomeChecklist'
// U.4.2 — HeroAgent deleted. The right Ask rail is the AI surface on dashboard.

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function absoluteTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function resourceLink(entityType: string, entityId: string): string {
  if (entityType === 'contract') return `/contracts/${entityId}`
  if (entityType === 'contract_request') return `/requests`
  if (entityType === 'approval_instance') return `/approvals`
  return '/dashboard'
}

// Deterministic colour-class for an actor id. Keeps the same avatar colour
// across renders without pulling in a whole colour-hash library.
const ACTOR_PALETTE = [
  'bg-brass-400/15 text-brass-300 ring-1 ring-brass-400/25',
  'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25',
  'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25',
  'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25',
  'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25',
  'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25',
  'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25',
  'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25',
]
function actorColor(actorId: string): string {
  let h = 0
  for (let i = 0; i < actorId.length; i++) h = (h * 31 + actorId.charCodeAt(i)) >>> 0
  return ACTOR_PALETTE[h % ACTOR_PALETTE.length]
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: string
  actorId: string
  actorName: string
  actorInitials: string
  verb: string
  entityType: string
  entityId: string
  entityTitle: string
  entityStatus?: string
  secondary?: string
  createdAt: string
}

// P7.1.1 — Per-user "your day" surface. Counts + inline rows for the
// items that need the user's attention TODAY. The arrays let the
// dashboard render persona-aware cards instead of dumping the user
// into the org-wide list view.
export interface YourDayContractRow {
  id: string
  title: string
  type: string
  status: string
  counterpartyName: string | null
  value: number | null
  currency: string | null
  // Negotiations only:
  riskScore?: number | null
  daysSinceUpdate?: number | null
  // Renewals only:
  expiryDate?: string | null
  daysToExpiry?: number | null
}

interface YourDay {
  approvalsWaiting: number
  requestsWaiting: number
  contractsExpiring: number
  draftsInProgress: number
  // P7.1.1 — F-78 fix: surface contracts the user owns that are in
  // negotiation, so Legal lands on dashboard and immediately sees
  // their headline contract instead of "all caught up".
  negotiationsInFlight?: number
  total: number
  // P7.1.1 — Inline cards for the dashboard. Each array max 5 entries.
  negotiations?: YourDayContractRow[]
  renewals?: YourDayContractRow[]
}

interface DashboardStats {
  activeContracts: number
  openRequests: number
  pendingApprovals: number
  // P7.2.3 — Org-wide pending approval count, used by admin / legal-ops
  // who don't typically appear in step queues but need the oversight signal.
  orgPendingApprovals?: number
  expiringSoon: number
  yourDay?: YourDay
  recentActivity: ActivityEntry[]
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // P7.2.3 — Admin-like roles get the org-wide oversight KPI variant.
  const isAdminLike = (user?.roles ?? []).some(r => r === 'ADMIN' || r === 'LEGAL_OPS')

  // B.6.6 — Quick Actions open their modals inline instead of routing
  // away. "Upload Contract" on the dashboard should upload a contract,
  // not take me on a detour through the list page first.
  const [showUpload, setShowUpload] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const cards = [
    {
      label: 'Active Contracts',
      value: stats?.activeContracts,
      icon: FileText,
      color: 'text-sky-300',
      bg: 'bg-sky-500/10 border border-sky-500/20',
      to: '/contracts',
    },
    {
      label: 'Open Requests',
      value: stats?.openRequests,
      icon: ClipboardList,
      color: 'text-brass-300',
      bg: 'bg-brass-400/10 border border-brass-400/25',
      to: '/requests',
    },
    {
      label: isAdminLike ? 'Org Approvals' : 'Pending Approvals',
      value: isAdminLike ? (stats?.orgPendingApprovals ?? 0) : stats?.pendingApprovals,
      icon: CheckSquare,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10 border border-emerald-500/20',
      to: '/approvals',
    },
    {
      label: 'Expiring Soon',
      value: stats?.expiringSoon,
      icon: AlertCircle,
      color: (stats?.expiringSoon ?? 0) > 0 ? 'text-rose-300' : 'text-slate-500',
      bg: (stats?.expiringSoon ?? 0) > 0 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/[0.03] border border-white/10',
      to: (() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return `/contracts?expiryDateTo=${d.toISOString().slice(0, 10)}&filterLabel=Expiring+within+30+days`
      })(),
    },
  ]

  return (
    <div className="px-6 lg:px-10 py-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow">Good day, counsel</p>
          <h1 className="headline mt-3 text-4xl md:text-5xl text-white">
            Welcome back, <span className="headline-italic text-brass-gradient">{user?.name?.split(' ')[0] ?? 'friend'}</span>.
          </h1>
          <p className="text-sm text-slate-400 mt-3 font-light max-w-xl">
            Here&apos;s what&apos;s moving across your contracts, matters, and obligations today.
          </p>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-[11px] uppercase tracking-widest text-slate-500">Today</div>
          <div className="text-white font-serif text-lg mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Welcome checklist — surfaces deferred onboarding tasks for admins
          who finished the 2-step wizard. Auto-hides when complete or
          dismissed; persists dismissal to org.settings. */}
      <WelcomeChecklist />

      {/* D.2.1 — Hero agent. Hidden behind AGENT_SIDE_PANEL_V2 flag.
          Above Your Day because "what can I ask AI to do" is the new
          first-of-day orientation; the stats below still answer "what
          needs me" for users who prefer checking queues.
          U.4.2 — HeroAgent deleted (doc 32 §11b item 6). Decision 14a
          locked AI to two surfaces only: the rail (companion) and the
          /agent route (studio). The dashboard's HeroAgent input was
          the third — confused users and competed with the rail. */}

      {/* B.6.15 — Your day band. Renders before KPIs because "what
          needs me" beats "what's the state of the org" for a user's
          first-of-day orientation. */}
      {!isLoading && stats?.yourDay && (
        <YourDayBand yourDay={stats.yourDay} />
      )}

      {/* Quick Actions — promoted above KPIs so the action-oriented buttons
          land in the first eye-stop (was buried below the cards). Same
          three actions, same selectors — only the position moved. */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="dashboard-quick-actions">
        <button
          onClick={() => setShowUpload(true)}
          data-testid="quick-upload-contract"
          className="btn-brass text-[13px]"
        >
          <Upload className="h-4 w-4" /> Upload Contract
        </button>
        <button
          onClick={() => setShowNewRequest(true)}
          data-testid="quick-new-request"
          className="btn-ghost-luxe text-[13px]"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
        <button
          onClick={() => navigate('/approvals')}
          data-testid="quick-view-approvals"
          className="btn-ghost-luxe text-[13px]"
        >
          <CheckSquare className="h-4 w-4" /> View Approvals
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="dashboard-kpi-cards">
        {cards.map(({ label, value, icon: Icon, color, bg, to }) => {
          const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          return (
            <button
              key={label}
              onClick={() => navigate(to)}
              data-testid={`kpi-card-${slug}`}
              data-kpi-label={label}
              data-kpi-value={value ?? ''}
              className="luxe-card group p-5 space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
                <div className={`p-1.5 rounded-md ${bg}`}>
                  <Icon size={14} className={color} />
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              ) : (
                <div className="flex items-end justify-between">
                  <p className="font-serif text-4xl text-white tabular-nums" data-testid={`kpi-value-${slug}`}>{value ?? 0}</p>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-brass-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="luxe-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow">Signal</p>
            <h2 className="headline text-2xl text-white mt-2">Recent Activity</h2>
          </div>
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <span className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">
              {stats.recentActivity.length} event{stats.recentActivity.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading activity…</span>
          </div>
        ) : !stats?.recentActivity?.length ? (
          (stats?.activeContracts ?? 0) > 0 ? (
            <div className="text-center py-12" data-testid="activity-empty-warm">
              <p className="text-sm text-slate-400">
                No recent activity to show.
              </p>
              <p className="text-xs text-slate-600 mt-1.5">
                Edits, comments, approvals and signatures will appear here as your team works.
              </p>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="activity-empty-cold">
              <p className="text-sm text-slate-400">
                No team activity yet.
              </p>
              <p className="text-xs text-slate-600 mt-1.5">
                Upload a contract or submit a request to get started.
              </p>
            </div>
          )
        ) : (
          <ul className="divide-y divide-white/5">
            {stats.recentActivity.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => navigate(resourceLink(event.entityType, event.entityId))}
                  className="w-full flex items-start gap-3 py-3 text-left hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors group"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${actorColor(event.actorId)}`}
                    aria-hidden
                  >
                    {event.actorInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-slate-200 leading-snug">
                      <span className="font-medium text-white">{event.actorName}</span>
                      {' '}
                      <span className="text-slate-400">{event.verb}</span>
                      {' '}
                      <span className="font-medium text-white underline-offset-2 group-hover:underline decoration-brass-400/60 truncate">
                        {event.entityTitle}
                      </span>
                    </p>
                    {event.secondary && (
                      <p className="mt-0.5 text-xs text-slate-500">{event.secondary}</p>
                    )}
                  </div>
                  <time
                    className="text-[11px] text-slate-500 whitespace-nowrap shrink-0 pt-0.5 font-mono"
                    dateTime={event.createdAt}
                    title={absoluteTime(event.createdAt)}
                  >
                    {relativeTime(event.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        B.6.6 — Dashboard Quick Actions now open their modals in place,
        matching the Gmail-Compose / Linear-New-Issue pattern. Upload
        success invalidates the dashboard-stats query so the KPI tiles +
        activity feed reflect the new contract without a reload.
      */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            // Sonner toast — gives users immediate feedback that the upload
            // landed and that extraction is now running. Previously the modal
            // just closed silently, leaving the user wondering if anything
            // happened.
            toast.success('Contract uploaded', {
              description: 'Extraction started — facts and clauses will populate in a few seconds.',
            })
          }}
        />
      )}
      {showNewRequest && (
        <NewRequestModal
          onClose={() => {
            setShowNewRequest(false)
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }}
        />
      )}
    </div>
  )
}

// ─── "Your day" band (B.6.15) ─────────────────────────────────────────────────

interface YourDayBandProps { yourDay: YourDay }

function YourDayBand({ yourDay }: YourDayBandProps) {
  const navigate = useNavigate()

  // All-clear state — reassuring rather than empty
  if (yourDay.total === 0 && yourDay.draftsInProgress === 0) {
    return (
      <div
        data-testid="your-day-band"
        className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-6 py-5 flex items-center gap-4"
      >
        <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CircleCheckBig className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <p className="text-[15px] font-medium text-emerald-100 font-serif">You&apos;re all caught up.</p>
          <p className="text-xs text-emerald-200/70 mt-0.5 font-light">
            No approvals, requests, or expiring contracts need your attention today.
          </p>
        </div>
      </div>
    )
  }

  const chips: Array<{
    key: string
    icon: typeof CheckSquare
    count: number
    label: string
    verb: string
    to: string
    accent: 'amber' | 'blue' | 'red' | 'gray'
  }> = []

  if (yourDay.approvalsWaiting > 0) chips.push({
    key: 'approvals',
    icon: CheckSquare,
    count: yourDay.approvalsWaiting,
    label: yourDay.approvalsWaiting === 1 ? 'approval' : 'approvals',
    verb: 'waiting on your decision',
    to: '/approvals',
    accent: 'amber',
  })

  if (yourDay.requestsWaiting > 0) chips.push({
    key: 'requests',
    icon: ClipboardList,
    count: yourDay.requestsWaiting,
    label: yourDay.requestsWaiting === 1 ? 'request' : 'requests',
    verb: 'assigned to you',
    to: '/requests',
    accent: 'blue',
  })

  if (yourDay.contractsExpiring > 0) chips.push({
    key: 'expiring',
    icon: Clock,
    count: yourDay.contractsExpiring,
    label: yourDay.contractsExpiring === 1 ? 'contract' : 'contracts',
    verb: yourDay.contractsExpiring === 1 ? 'you own expires in 90 days' : 'you own expire in 90 days',
    to: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 90)
      return `/contracts?expiryDateTo=${d.toISOString().slice(0, 10)}&filterLabel=${encodeURIComponent('Your contracts expiring in 90 days')}`
    })(),
    accent: 'red',
  })

  // P7.1.1 — F-78 fix: negotiations chip for the Legal persona, whose
  // primary JTBD is "review contracts in flight".
  const negCount = yourDay.negotiationsInFlight ?? 0
  if (negCount > 0) chips.push({
    key: 'negotiations',
    icon: MessageSquareWarning,
    count: negCount,
    label: negCount === 1 ? 'negotiation' : 'negotiations',
    verb: negCount === 1 ? 'in flight you own' : 'in flight you own',
    to: '/contracts?status=UNDER_NEGOTIATION',
    accent: 'amber',
  })

  if (yourDay.draftsInProgress > 0) chips.push({
    key: 'drafts',
    icon: FileEdit,
    count: yourDay.draftsInProgress,
    label: yourDay.draftsInProgress === 1 ? 'draft' : 'drafts',
    verb: 'in progress',
    to: '/contracts?status=DRAFT',
    accent: 'gray',
  })

  const accentStyles: Record<string, { chip: string; icon: string; dot: string }> = {
    amber: { chip: 'bg-brass-400/8 hover:bg-brass-400/15 border-brass-400/30 text-brass-100', icon: 'text-brass-300', dot: 'bg-brass-400' },
    blue:  { chip: 'bg-sky-500/8 hover:bg-sky-500/15 border-sky-500/30 text-sky-100',         icon: 'text-sky-300',   dot: 'bg-sky-400' },
    red:   { chip: 'bg-rose-500/8 hover:bg-rose-500/15 border-rose-500/30 text-rose-100',     icon: 'text-rose-300',  dot: 'bg-rose-400' },
    gray:  { chip: 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-200',    icon: 'text-slate-400', dot: 'bg-slate-500' },
  }

  return (
    <div data-testid="your-day-band" className="luxe-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="eyebrow">
            {yourDay.total > 0 ? 'Your day' : 'In progress'}
          </p>
          <p className="text-[13px] text-slate-400 mt-2 font-light">
            {yourDay.total > 0
              ? `${yourDay.total} item${yourDay.total === 1 ? '' : 's'} need${yourDay.total === 1 ? 's' : ''} your attention.`
              : 'Nothing is blocking on you — just your ongoing drafts.'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {chips.map((c) => {
          const s = accentStyles[c.accent]
          return (
            <button
              key={c.key}
              onClick={() => navigate(c.to)}
              data-testid={`your-day-chip-${c.key}`}
              className={`inline-flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-colors ${s.chip}`}
            >
              <c.icon className={`h-4 w-4 ${s.icon}`} />
              <span className="text-[13px]">
                <span className="font-semibold tabular-nums text-white">{c.count}</span>{' '}
                <span className="font-medium">{c.label}</span>{' '}
                <span className="opacity-70">{c.verb}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 opacity-40" />
            </button>
          )
        })}
      </div>

      {/* P7.1.1 — Inline cards. The chips above tell the user "you
          have 1 negotiation"; these cards tell them WHICH ONE so they
          can act in one click. Each row links straight to the contract
          detail. Surface negotiations + renewals (the two persona
          JTBDs that the chips alone don't satisfy). */}
      {((yourDay.negotiations?.length ?? 0) > 0 || (yourDay.renewals?.length ?? 0) > 0) && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="your-day-cards">
          {(yourDay.negotiations?.length ?? 0) > 0 && (
            <YourDayList
              title="Negotiations in flight"
              icon={MessageSquareWarning}
              accent="amber"
              rows={yourDay.negotiations!}
              renderMeta={(r) => (
                <>
                  {r.value && (
                    <span className="font-medium text-foreground">
                      {(r.currency ?? 'USD')} {r.value.toLocaleString()}
                    </span>
                  )}
                  {typeof r.riskScore === 'number' && r.riskScore > 0.4 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      RISK {Math.round((r.riskScore ?? 0) * 100)}%
                    </span>
                  )}
                  {typeof r.daysSinceUpdate === 'number' && (
                    <span className="text-slate-500">
                      updated {r.daysSinceUpdate === 0 ? 'today' : `${r.daysSinceUpdate}d ago`}
                    </span>
                  )}
                </>
              )}
              onClickRow={(r) => navigate(`/contracts/${r.id}`)}
            />
          )}
          {(yourDay.renewals?.length ?? 0) > 0 && (
            <YourDayList
              title="Renewals coming up"
              icon={Repeat}
              accent="red"
              rows={yourDay.renewals!}
              renderMeta={(r) => (
                <>
                  {r.value && (
                    <span className="font-medium text-white">
                      {(r.currency ?? 'USD')} {r.value.toLocaleString()}
                    </span>
                  )}
                  {typeof r.daysToExpiry === 'number' && (
                    <span className={r.daysToExpiry <= 30 ? 'text-rose-300 font-medium' : r.daysToExpiry <= 60 ? 'text-brass-300 font-medium' : 'text-slate-500'}>
                      {r.daysToExpiry < 0 ? `${-r.daysToExpiry}d overdue` :
                       r.daysToExpiry === 0 ? 'expires today' :
                       `expires in ${r.daysToExpiry}d`}
                    </span>
                  )}
                </>
              )}
              onClickRow={(r) => navigate(`/contracts/${r.id}`)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── YourDayList — inline contract-row card section (P7.1.1) ────────────────

interface YourDayListProps {
  title: string
  icon: typeof MessageSquareWarning
  accent: 'amber' | 'red' | 'blue'
  rows: YourDayContractRow[]
  renderMeta: (r: YourDayContractRow) => React.ReactNode
  onClickRow: (r: YourDayContractRow) => void
}

function YourDayList({ title, icon: Icon, accent, rows, renderMeta, onClickRow }: YourDayListProps) {
  const headerColor = {
    amber: 'text-brass-300',
    red:   'text-rose-300',
    blue:  'text-sky-300',
  }[accent]

  return (
    <div className="rounded-xl border border-white/8 bg-obsidian-900/60 overflow-hidden" data-testid={`your-day-list-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="px-4 py-2.5 border-b border-white/5 bg-obsidian-800/50 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${headerColor}`} />
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-300">{title}</h3>
        <span className="text-[11px] text-slate-500 font-mono">· {rows.length}</span>
      </div>
      <ul className="divide-y divide-white/5">
        {rows.map(r => (
          <li
            key={r.id}
            onClick={() => onClickRow(r)}
            className="px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
            data-testid={`your-day-row-${r.id}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-white truncate">{r.title}</div>
                <div className="text-[11.5px] text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                  {r.counterpartyName && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {r.counterpartyName}
                    </span>
                  )}
                  {renderMeta(r)}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
