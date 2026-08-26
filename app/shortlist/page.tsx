'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '../components/DashboardShell'
import PillLink from '../components/PillLink'
import { listShortlist, readSession, removeFromShortlist, type ShortlistEntry } from '../../lib/api'

export default function ShortlistPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ShortlistEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    const session = readSession()
    if (!session) {
      router.push('/login')
      return
    }
    listShortlist()
      .then(setEntries)
      .catch((err) => setError(err?.message || 'Could not load your shortlist.'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleRemove(id: number) {
    setRemovingId(id)
    try {
      await removeFromShortlist(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not remove that entry.',
      )
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <DashboardShell
      title="Shortlist"
      subtitle="Freelancers you've saved to compare before hiring."
      action={
        <PillLink href="/browse" variant="light">
          Browse freelancers
        </PillLink>
      }
    >
      {loading && <p className="text-muted">Loading…</p>}
      {error && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!loading && entries.length === 0 && !error && (
        <p className="text-muted">
          Nothing saved yet — visit a freelancer&apos;s profile and hit &quot;Save to shortlist&quot;.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map(({ id, freelancer }) => (
          <div key={id} className="rounded-2xl border border-ink/10 bg-white/50 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl italic">{freelancer.display_name || freelancer.full_name}</p>
                <p className="text-xs text-muted">@{freelancer.username}</p>
              </div>
              {freelancer.hourly_rate && (
                <p className="shrink-0 text-sm font-medium">
                  {freelancer.currency} {freelancer.hourly_rate}/hr
                </p>
              )}
            </div>
            {freelancer.headline && <p className="mt-2 text-sm text-ink/80">{freelancer.headline}</p>}
            {freelancer.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {freelancer.tags.map((t) => (
                  <span key={t.id} className="rounded-pill bg-ink/5 px-2.5 py-1 text-xs text-ink/60">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <PillLink href={`/freelancers/${freelancer.username}`} variant="dark">
                View profile
              </PillLink>
              <button
                onClick={() => handleRemove(id)}
                disabled={removingId === id}
                className="rounded-pill border border-ink/20 px-5 py-2 text-sm hover:border-ink/50 disabled:opacity-50"
              >
                {removingId === id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
