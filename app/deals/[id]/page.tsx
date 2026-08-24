'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardShell from '../../components/DashboardShell'
import { getDeal, performDealAction, readSession, type Deal, type DealAction } from '../../../lib/api'

const STATUS_LABEL: Record<Deal['status'], string> = {
  DRAFT: 'Draft',
  PROPOSED: 'Proposed',
  ACCEPTED: 'Accepted',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
}

const ACTIONS_FOR_STATUS: Record<Deal['status'], { action: DealAction; label: string }[]> = {
  DRAFT: [{ action: 'propose', label: 'Propose to freelancer' }],
  PROPOSED: [
    { action: 'accept', label: 'Accept' },
    { action: 'cancel', label: 'Cancel' },
  ],
  ACCEPTED: [
    { action: 'sign', label: 'Sign' },
    { action: 'complete', label: 'Mark complete' },
    { action: 'dispute', label: 'Raise a dispute' },
    { action: 'cancel', label: 'Cancel' },
  ],
  ACTIVE: [
    { action: 'complete', label: 'Mark complete' },
    { action: 'dispute', label: 'Raise a dispute' },
    { action: 'cancel', label: 'Cancel' },
  ],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
}

export default function DealDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<DealAction | null>(null)

  const load = useCallback(() => {
    getDeal(Number(params.id))
      .then(setDeal)
      .catch((err) => setError(err?.message || 'Could not load this deal.'))
  }, [params.id])

  useEffect(() => {
    if (!readSession()) {
      router.push('/login')
      return
    }
    load()
  }, [router, load])

  async function handleAction(action: DealAction) {
    setBusy(action)
    setError(null)
    try {
      const updated = await performDealAction(Number(params.id), action)
      setDeal(updated)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : `Could not ${action} this deal.`,
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell title="Deal" subtitle={deal ? deal.title : 'Loading…'}>
      {error && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {deal && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/50 p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Status</p>
              <p className="mt-1 font-display text-2xl italic">{STATUS_LABEL[deal.status]}</p>
            </div>
            <div className="text-right text-sm text-muted">
              <p>{deal.client_username} → {deal.freelancer_username || 'unassigned'}</p>
              {deal.compensation_amount && (
                <p className="mt-1 font-medium text-ink">
                  {deal.currency} {deal.compensation_amount}
                </p>
              )}
            </div>
          </div>

          {deal.scope && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Scope</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{deal.scope}</p>
            </div>
          )}

          {deal.terms && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Terms</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{deal.terms}</p>
            </div>
          )}

          {deal.deadline && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Deadline</p>
              <p className="mt-1 text-sm text-ink/80">{new Date(deal.deadline).toLocaleDateString()}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-6">
            {ACTIONS_FOR_STATUS[deal.status].map(({ action, label }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={busy !== null}
                className="rounded-pill border border-ink/20 px-5 py-2 text-sm hover:border-ink/50 disabled:opacity-50"
              >
                {busy === action ? 'Working…' : label}
              </button>
            ))}
            {ACTIONS_FOR_STATUS[deal.status].length === 0 && (
              <p className="text-sm text-muted">This deal is in a final state — no further actions.</p>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
