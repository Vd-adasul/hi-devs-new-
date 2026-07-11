/**
 * ContractMatterPicker (P4.2 / docs/30 D.7.2)
 *
 * Inline matter assignment on the contract detail header. Shows:
 *   • "Add to matter" when no assignment
 *   • The matter name when assigned (click → detail), with an × to unlink
 *   • A dropdown search-picker when the user clicks "Add to matter"
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, X, Search } from 'lucide-react'
import { api } from '@/lib/api'

interface MatterLite {
  id: string
  name: string
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED'
  counterpartyName: string | null
  contractCount: number
}

export function ContractMatterPicker({
  contractId,
  currentMatterId,
}: {
  contractId: string
  currentMatterId: string | null
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data } = useQuery({
    queryKey: ['matters-picker'],
    queryFn: async () => (await api.get<{ items: MatterLite[]; total: number }>('/matters', {
      params: { status: 'OPEN', limit: 100 },
    })).data,
    enabled: open,
  })

  const currentMatter = useMemo(
    () => (data?.items ?? []).find(m => m.id === currentMatterId),
    [data, currentMatterId],
  )

  const assign = useMutation({
    mutationFn: async (matterId: string | null) => {
      if (matterId) {
        return api.post(`/matters/${matterId}/attach`, { kind: 'contract', entityId: contractId }).then(r => r.data)
      }
      // Unlink — attach to '' isn't supported; use PATCH on contract directly
      return api.patch(`/contracts/${contractId}`, { matterId: null }).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] })
      qc.invalidateQueries({ queryKey: ['matter'] })
      qc.invalidateQueries({ queryKey: ['matters-picker'] })
      setOpen(false)
    },
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.items ?? []).filter(m =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.counterpartyName ?? '').toLowerCase().includes(q)
    )
  }, [data, search])

  // If the current matter wasn't in the OPEN list (CLOSED or archived),
  // fetch it on-demand.
  const { data: onePick } = useQuery({
    queryKey: ['matter-one', currentMatterId],
    enabled: !!currentMatterId && !currentMatter,
    queryFn: async () => (await api.get<MatterLite & { id: string }>(`/matters/${currentMatterId}`)).data,
  })
  const effectiveCurrent = currentMatter ?? onePick

  if (effectiveCurrent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10.5px] font-medium text-indigo-900"
            data-testid="contract-matter-badge"
            data-matter-id={effectiveCurrent.id}>
        <Briefcase className="h-3 w-3" />
        <Link to={`/matters/${effectiveCurrent.id}`} className="hover:underline truncate max-w-[180px]">
          {effectiveCurrent.name}
        </Link>
        <button
          type="button"
          onClick={() => assign.mutate(null)}
          title="Unlink from matter"
          data-testid="contract-matter-unlink"
          className="hover:bg-indigo-200 rounded-full p-0.5"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="contract-matter-add-btn"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10.5px] text-muted-foreground hover:text-indigo-700 hover:border-indigo-300"
      >
        <Briefcase className="h-3 w-3" /> Add to matter
      </button>
    )
  }

  return (
    <div className="relative">
      <div
        data-testid="contract-matter-picker"
        className="absolute top-6 left-0 z-20 w-80 rounded-lg border border-gray-200 bg-white shadow-lg text-gray-900"
      >
        <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search open matters…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-7 pr-2 py-1 text-[12px] rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              data-testid="contract-matter-picker-search"
            />
          </div>
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-[11.5px] text-gray-500 italic">
              No matching open matters. <Link to="/matters" className="underline text-indigo-600">Create one.</Link>
            </li>
          )}
          {filtered.map(m => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => assign.mutate(m.id)}
                data-testid={`contract-matter-pick-${m.id}`}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 flex items-baseline gap-2 transition-colors"
              >
                <Briefcase className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                <span className="font-medium text-[12px] text-gray-900 truncate">{m.name}</span>
                {m.counterpartyName && <span className="text-[10.5px] text-gray-500 truncate">· {m.counterpartyName}</span>}
                <span className="ml-auto text-[10px] text-gray-400 font-semibold">{m.contractCount}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] bg-gray-50 rounded-b-lg">
          <Link to="/matters" className="text-indigo-600 hover:underline font-semibold" onClick={() => setOpen(false)}>
            + New matter
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
