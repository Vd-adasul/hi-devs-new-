/**
 * ApprovalCard — Phase 06
 * Shows contract summary + AI analysis + decision buttons for a pending approval step.
 * Used in the Approvals "My Queue" page and on contract detail.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { UserPicker } from '@/components/common/UserPicker'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp,
  AlertTriangle, Building2, DollarSign, Calendar, Loader2, Sparkles, ExternalLink,
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  type: string
  value?: number | null
  counterpartyName?: string | null
  status: string
}

interface InstanceContext {
  id: string
  status: string
  submittedAt: string
  submittedByName?: string
  aiSummary?: string
  keyRisks?: Array<{ title: string; description: string; severity: string }>
  nonStandardTerms?: string[]
  approvalRecommendation?: string
}

interface Props {
  stepId:     string
  instanceId: string
  stepName:   string
  contract:   Contract
  instance:   InstanceContext
  onDecided?: () => void
}

const SEVERITY_COLOR: Record<string, string> = {
  low:      'bg-amber-500/10 border-amber-500/20 text-amber-300',
  medium:   'bg-amber-500/10 border-amber-500/20 text-amber-300',
  high:     'bg-rose-500/10 border-rose-500/20 text-rose-300',
  critical: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
}

const REC_CONFIG: Record<string, { color: string; label: string }> = {
  approve:         { color: 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20', label: 'AI recommends: Approve' },
  review_required: { color: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',     label: 'AI recommends: Review Required' },
  reject_advised:  { color: 'text-rose-300 bg-rose-500/10 border border-rose-500/20',         label: 'AI recommends: Reject' },
}

export function ApprovalCard({ stepId, instanceId, stepName, contract, instance, onDecided }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'DELEGATED' | null>(null)
  const [comment, setComment] = useState('')
  const [delegateTo, setDelegateTo] = useState('')
  const [showRisks, setShowRisks] = useState(false)

  // B.6.11 — UserPicker fetches the roster itself; no need to manage
  // org-user query state here anymore.

  const submitDecision = useMutation({
    mutationFn: (payload: { stepId: string; decision: string; comment?: string; delegateTo?: string }) =>
      api.post(`/approvals/${instanceId}/decide`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
      queryClient.invalidateQueries({ queryKey: ['contract-approval', contract.id] })
      queryClient.invalidateQueries({ queryKey: ['contract', contract.id] })
      queryClient.invalidateQueries({ queryKey: ['approval-instance', instanceId] })
      onDecided?.()
    },
  })

  function handleSubmit() {
    if (!decision) return
    if (decision === 'REJECTED' && !comment.trim()) return
    if (decision === 'DELEGATED' && !delegateTo) return
    submitDecision.mutate({ stepId, decision, comment: comment.trim() || undefined, delegateTo: delegateTo || undefined })
  }

  const hasRisks = (instance.keyRisks?.length ?? 0) > 0 || (instance.nonStandardTerms?.length ?? 0) > 0
  const rec = instance.approvalRecommendation ? REC_CONFIG[instance.approvalRecommendation] : null

  return (
    <div
      className="bg-obsidian-700 rounded-xl border shadow-sm overflow-hidden"
      data-testid={`approval-card-${stepId}`}
      data-instance-id={instanceId}
      data-contract-id={contract.id}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b bg-obsidian-900/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stepName}</p>
            <button
              onClick={() => navigate(`/contracts/${contract.id}`)}
              className="text-base font-semibold text-white mt-0.5 leading-snug hover:text-blue-700 transition-colors text-left flex items-center gap-1.5 group"
            >
              {contract.title}
              <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </button>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
            {contract.type}
          </span>
        </div>

        {/* Contract meta */}
        <div className="flex flex-wrap gap-3 mt-3">
          {contract.counterpartyName && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="h-3 w-3" />{contract.counterpartyName}
            </span>
          )}
          {contract.value != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <DollarSign className="h-3 w-3" />{Number(contract.value).toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            Submitted {new Date(instance.submittedAt).toLocaleDateString()} by {instance.submittedByName ?? 'Unknown'}
          </span>
        </div>
      </div>

      {/* AI Summary */}
      {instance.aiSummary ? (
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">AI Summary</span>
            {rec && (
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${rec.color}`}>
                {rec.label}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{instance.aiSummary}</p>

          {hasRisks && (
            <button
              onClick={() => setShowRisks(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mt-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {instance.keyRisks?.length ?? 0} risk{(instance.keyRisks?.length ?? 0) !== 1 ? 's' : ''} identified
              {showRisks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}

          {showRisks && hasRisks && (
            <div className="mt-3 space-y-2">
              {instance.keyRisks?.map((risk, i) => (
                <div key={i} className={`rounded-md border px-3 py-2 text-xs ${SEVERITY_COLOR[risk.severity] ?? SEVERITY_COLOR['medium']}`}>
                  <p className="font-semibold">{risk.title}</p>
                  <p className="mt-0.5 opacity-90">{risk.description}</p>
                </div>
              ))}
              {instance.nonStandardTerms && instance.nonStandardTerms.length > 0 && (
                <div className="text-xs text-slate-400 border rounded-md px-3 py-2 bg-obsidian-900">
                  <p className="font-semibold mb-1 text-slate-300">Non-standard terms:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    {instance.nonStandardTerms.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-3 border-b flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          AI summary is being generated…
        </div>
      )}

      {/* Decision area */}
      {submitDecision.isSuccess ? (
        <div className="px-5 py-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Decision recorded successfully.
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3">
          {/* Decision buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={decision === 'APPROVED' ? 'default' : 'outline'}
              className={decision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'}
              onClick={() => setDecision(d => d === 'APPROVED' ? null : 'APPROVED')}
              data-testid="approval-approve-btn"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />Approve
            </Button>
            <Button
              size="sm"
              variant={decision === 'REJECTED' ? 'default' : 'outline'}
              className={decision === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'}
              onClick={() => setDecision(d => d === 'REJECTED' ? null : 'REJECTED')}
              data-testid="approval-reject-btn"
            >
              <XCircle className="h-4 w-4 mr-1.5" />Reject
            </Button>
            <Button
              size="sm"
              variant={decision === 'DELEGATED' ? 'secondary' : 'ghost'}
              className="text-slate-400"
              onClick={() => setDecision(d => d === 'DELEGATED' ? null : 'DELEGATED')}
            >
              <ArrowRight className="h-4 w-4 mr-1.5" />Delegate
            </Button>
          </div>

          {/* Rejection comment */}
          {(decision === 'REJECTED' || decision === 'APPROVED') && (
            <textarea
              placeholder={decision === 'REJECTED' ? 'Reason for rejection (required)…' : 'Optional comment…'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-white/14 text-sm px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}

          {/* Delegation — B.6.11 type-ahead picker shared with DecisionStrip */}
          {decision === 'DELEGATED' && (
            <div className="space-y-2">
              <UserPicker
                value={delegateTo}
                onChange={(id) => setDelegateTo(id)}
                placeholder="Delegate to which teammate? Search by name or email…"
                testId="delegate-user-picker"
                autoFocus
              />
              <textarea
                placeholder="Reason for delegation (optional)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-white/14 text-sm px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Submit */}
          {decision && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={
                  submitDecision.isPending ||
                  (decision === 'REJECTED' && !comment.trim()) ||
                  (decision === 'DELEGATED' && !delegateTo)
                }
                className="gap-1.5"
                data-testid="approval-confirm-btn"
              >
                {submitDecision.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm {decision === 'APPROVED' ? 'Approval' : decision === 'REJECTED' ? 'Rejection' : 'Delegation'}
              </Button>
              {submitDecision.isError && (
                <span className="text-xs text-rose-300">
                  {(submitDecision.error as Error)?.message ?? 'Failed — try again'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
