'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '../../components/DashboardShell'
import PillLink from '../../components/PillLink'
import { applyToDeal, listOpenDeals, readSession, type OpenDeal } from '../../../lib/api'

export default function OpenDealsPage() {
  const [deals, setDeals] = useState<OpenDeal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)
  const [appliedIds, setAppliedIds] = useState<number[]>([])

  useEffect(() => {
    listOpenDeals()
      .then(setDeals)
      .catch((err) => setError(err?.message || 'Could not load open work.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleApply(id: number) {
    if (!readSession()) {
      window.location.href = '/login'
      return
    }
    setApplying(id)
    setError(null)
    try {
      await applyToDeal(id)
      setAppliedIds((prev) => [...prev, id])
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not apply to that deal.',
      )
    } finally {
      setApplying(null)
    }
  }

  return (
    <DashboardShell
      title="Open work"
      subtitle="Clients looking for someone to take this on. First to apply gets it."
      action={
        <PillLink href="/deals" variant="light">
          Your deals
        </PillLink>
      }
    >
      {loading && <p className="text-muted">Loading…</p>}
      {error && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!loading && deals.length === 0 && !error && (
        <p className="text-muted">Nothing open right now — check back later.</p>
      )}

      <div className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="rounded-2xl border border-ink/10 bg-white/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl italic">{deal.title}</p>
                <p className="text-xs text-muted">from {deal.client_username}</p>
              </div>
              {deal.compensation_amount && (
                <p className="shrink-0 font-medium">
                  {deal.currency} {deal.compensation_amount}
                </p>
              )}
            </div>
            {deal.scope && <p className="mt-3 text-sm text-ink/80">{deal.scope}</p>}
            {deal.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {deal.tags.map((t) => (
                  <span key={t.id} className="rounded-pill bg-ink/5 px-2.5 py-1 text-xs text-ink/60">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => handleApply(deal.id)}
              disabled={applying === deal.id || appliedIds.includes(deal.id)}
              className="mt-4 rounded-pill bg-ink px-5 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
            >
              {appliedIds.includes(deal.id)
                ? 'Applied ✓'
                : applying === deal.id
                  ? 'Applying…'
                  : 'Apply for this'}
            </button>
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
