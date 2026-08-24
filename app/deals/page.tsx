'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '../components/DashboardShell'
import PillLink from '../components/PillLink'
import { listMyDeals, readSession, type DealListItem } from '../../lib/api'

export default function DealsListPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<DealListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!readSession()) {
      router.push('/login')
      return
    }
    listMyDeals()
      .then(setDeals)
      .catch((err) => setError(err?.message || 'Could not load your deals.'))
      .finally(() => setLoading(false))
  }, [router])

  return (
    <DashboardShell
      title="Your deals"
      subtitle="Everything you've proposed, agreed to, or completed."
      action={
        <PillLink href="/deals/new" variant="dark">
          Start a deal
        </PillLink>
      }
    >
      {loading && <p className="text-muted">Loading…</p>}
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!loading && !error && deals.length === 0 && (
        <p className="text-muted">No deals yet — start one from a chat you already had.</p>
      )}

      <div className="space-y-3">
        {deals.map((deal) => (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/50 p-4 hover:border-ink/30"
          >
            <div>
              <p className="font-medium">{deal.title}</p>
              <p className="text-sm text-muted">
                {deal.client_username} → {deal.freelancer_username || 'unassigned'}
              </p>
            </div>
            <div className="text-right text-sm text-muted">
              <p>{deal.status}</p>
              {deal.compensation_amount && (
                <p>
                  {deal.currency} {deal.compensation_amount}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  )
}
