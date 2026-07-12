/**
 * FocusedReviewDrawer — State 3 from the unified-canvas wireframes.
 *
 * Replaces the normal right rail (same 320px slot) when a user clicks an
 * inline risk/deviation marker or a rail risk item. Shows everything the
 * reviewer needs to decide on one clause in one place:
 *   - Title, severity, section reference
 *   - WHY THIS IS A RISK (AI-generated)
 *   - PLAYBOOK GAP — only for deviations, not risks
 *   - AI SUGGESTION — proposed replacement text (when available)
 *   - PLAYBOOK REFERENCE
 *   - Four actions: Accept · Edit manually · Reject · Mark Reviewed
 *   - Inline comments
 *   - Prev / Next navigation across risky clauses in severity order
 *
 * B.5.6 — UI only, local state. B.5.7 persists reviewState to the DB.
 */
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, X, ChevronLeft, ChevronRight, FileEdit, XCircle,
  BookOpen, Circle, MessageCircle, Sparkles, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { classifyRisk, type RiskClause, type RiskKind } from './RiskDecorations'

/** A playbook position as returned by GET /playbook/positions. */
interface PlaybookPosition {
  id:             string
  positionType:   'preferred' | 'acceptable' | 'fallback' | 'walkaway'
  content:        string
  notes?:         string | null
  clauseCategory?: { id: string; name: string } | null
}

const POSITION_TONE: Record<string, string> = {
  preferred:  'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  acceptable: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  fallback:   'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  walkaway:   'bg-rose-500/10 text-rose-300 border border-rose-500/20',
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** One clause with everything the drawer needs to render it. */
export interface FocusedClause extends RiskClause {
  clauseType?: string | null
  interpretation?: string | null
  sectionRef?: string | null
}

/** Review state kept per clause. Local in B.5.6, persisted in B.5.7. */
export type ReviewState = 'unreviewed' | 'reviewed' | 'resolved'

/** Human-readable label for a clauseType value like "limitation_of_liability". */
function labelClauseType(t: string | null | undefined): string {
  if (!t) return 'Clause'
  return t
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FocusedReviewDrawer({
  clauses,
  currentIndex,
  reviewStates,
  onPrev,
  onNext,
  onAccept,
  onReject,
  onEditManually,
  onMarkReviewed,
  onClose,
}: {
  clauses: FocusedClause[]
  currentIndex: number
  reviewStates: Record<string, ReviewState>
  onPrev: () => void
  onNext: () => void
  onAccept: (clauseId: string, suggestionText: string) => void
  onReject: (clauseId: string) => void
  onEditManually: (clauseId: string) => void
  onMarkReviewed: (clauseId: string) => void
  onClose: () => void
}) {
  const clause = clauses[currentIndex]

  // Query to fetch AI suggestion for the currently selected clause
  const { data: suggestionData, isLoading: loadingSuggestion } = useQuery<{ suggestion: string }>({
    queryKey: ['clause-remediation-suggestion', clause?.id],
    queryFn: () => api.post('/agent/assist', {
      selectedText: clause.content,
      action: 'suggest_alternative',
      contractType: clause.clauseType || 'general commercial',
    }).then(r => r.data),
    enabled: !!clause?.content,
    staleTime: 5 * 60_000,
  })

  // Wave 2.2 — real playbook comparison. Pull the org's playbook positions and
  // match them to this clause's type by category name (replaces the old
  // hardcoded "Playbook v2 / Non-standard" stub with grounded DB data).
  const { data: playbookPositions } = useQuery<PlaybookPosition[]>({
    queryKey: ['playbook-positions'],
    queryFn: () => api.get('/playbook/positions').then(r => r.data.data ?? []),
    staleTime: 5 * 60_000,
  })
  const matchedPositions = (playbookPositions ?? []).filter(p =>
    clause?.clauseType && p.clauseCategory?.name &&
    normalize(p.clauseCategory.name) === normalize(clause.clauseType),
  )

  // Keyboard: Esc closes, j/k nav like the rest of the app might adopt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,[contenteditable=true]')) return
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); onNext() }
      if (e.key === 'k' || e.key === 'ArrowUp')   { e.preventDefault(); onPrev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, onPrev])

  if (!clause) {
    return (
      <aside className="hidden xl:flex w-80 border-l bg-obsidian-700 overflow-y-auto flex-col p-5">
        <div className="text-sm text-gray-400 italic">No issue selected.</div>
      </aside>
    )
  }

  const kind: RiskKind = classifyRisk(clause.riskRating)
  const state = reviewStates[clause.id] ?? 'unreviewed'

  const severityColor =
    kind === 'risk'      ? 'bg-red-50 text-red-700 border-red-200'
    : kind === 'deviation' ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-obsidian-800 text-slate-400 border-white/10'

  const severityLabel =
    kind === 'risk' ? 'HIGH RISK'
    : kind === 'deviation' ? 'DEVIATION'
    : 'NOTED'

  const stateColor =
    state === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : state === 'reviewed' ? 'bg-obsidian-800 text-slate-300 border-white/10'
    : 'bg-amber-50 text-amber-700 border-amber-200'

  return (
    <aside className="hidden xl:flex w-80 border-l bg-obsidian-700 overflow-y-auto flex-col">
      {/* ── Header — prev / counter / next + close ─────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-obsidian-900">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            aria-label="Previous issue (k)"
            className="p-1 rounded text-slate-500 hover:bg-obsidian-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-400 tabular-nums min-w-[3.5rem] text-center">
            {currentIndex + 1} / {clauses.length}
          </span>
          <button
            onClick={onNext}
            disabled={currentIndex === clauses.length - 1}
            aria-label="Next issue (j)"
            className="p-1 rounded text-slate-500 hover:bg-obsidian-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={onClose}
          aria-label="Close focused review (Esc)"
          className="p-1 rounded text-gray-400 hover:bg-obsidian-700 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Severity + Title + Section ──────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide',
            severityColor,
          )}>
            <AlertTriangle className="h-3 w-3" />
            {severityLabel}
          </span>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize',
            stateColor,
          )}>
            {state}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white leading-snug">
          {labelClauseType(clause.clauseType)}
        </h3>
        {clause.sectionRef && (
          <p className="text-xs text-slate-500 mt-0.5">{clause.sectionRef}</p>
        )}
      </div>

      {/* ── WHY THIS IS A RISK ──────────────────────────────────────────── */}
      <Section title="Why this matters">
        {clause.interpretation ? (
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {clause.interpretation}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            The AI hasn't written an explanation for this clause yet.
          </p>
        )}
      </Section>

      {/* ── PLAYBOOK COMPARISON (deviations only) ─────────────────────── */}
      {kind === 'deviation' && (
        <Section title="Playbook comparison">
          {matchedPositions.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No playbook position defined for {labelClauseType(clause.clauseType)}.
              Add one in Admin → Playbook to compare this clause automatically.
            </p>
          ) : (
            <div className="space-y-2">
              {matchedPositions.map(p => (
                <div key={p.id} className="rounded-md border border-white/10 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
                      POSITION_TONE[p.positionType] ?? 'bg-obsidian-800 text-slate-400',
                    )}>
                      {p.positionType}
                    </span>
                    {p.clauseCategory?.name && (
                      <span className="text-[10px] text-gray-400 truncate">{p.clauseCategory.name}</span>
                    )}
                  </div>
                  {p.content && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-4">{stripHtml(p.content)}</p>
                  )}
                  {p.notes && <p className="mt-1 text-[11px] text-gray-400 italic">{p.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── AI SUGGESTION ──────────────────────────────────────────────── */}
      <Section title="AI suggestion">
        <div className="rounded-md border border-white/10 bg-obsidian-900 p-3 text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
          {loadingSuggestion ? (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Generating AI suggestion...
            </div>
          ) : suggestionData?.suggestion ? (
            <span className="font-medium text-white">{suggestionData.suggestion}</span>
          ) : (
            <span className="italic text-gray-400">No suggestion could be generated.</span>
          )}
        </div>
      </Section>

      {/* ── PLAYBOOK REFERENCE ─────────────────────────────────────────── */}
      <Section title="Playbook reference" icon={<BookOpen className="h-3.5 w-3.5 text-gray-400" />}>
        <div className="text-sm text-slate-400">
          <div className="font-medium text-slate-300">Standard Contract Playbook</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Link to specific rule pending playbook schema work.
          </div>
        </div>
      </Section>

      {/* ── ACTIONS ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b space-y-2">
        <button
          onClick={() => onAccept(clause.id, suggestionData?.suggestion ?? '')}
          disabled={loadingSuggestion || !suggestionData?.suggestion}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" /> Accept AI suggestion
        </button>
        <button
          onClick={() => onEditManually(clause.id)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-white/14 bg-obsidian-700 text-sm font-medium text-slate-300 hover:bg-obsidian-900"
        >
          <FileEdit className="h-4 w-4" /> Edit manually
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onReject(clause.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-white/14 bg-obsidian-700 text-sm font-medium text-slate-300 hover:bg-obsidian-900"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={() => onMarkReviewed(clause.id)}
            disabled={state === 'reviewed' || state === 'resolved'}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-white/14 bg-obsidian-700 text-sm font-medium text-slate-300 hover:bg-obsidian-900',
              (state === 'reviewed' || state === 'resolved') && 'opacity-60 cursor-not-allowed',
            )}
            title="Mark this clause as reviewed without changing it."
          >
            <Circle className="h-4 w-4" />
            {state === 'unreviewed' ? 'Mark reviewed' : 'Reviewed'}
          </button>
        </div>
      </div>

      {/* ── COMMENTS ───────────────────────────────────────────────────── */}
      <Section title={`Comments on this clause`}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MessageCircle className="h-4 w-4 text-gray-300" />
          Full inline comments land in B.3 (margin bubbles).
        </div>
      </Section>
    </aside>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="px-5 py-3.5 border-b last:border-b-0">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h4>
      </div>
      {children}
    </section>
  )
}
