'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import PillLink from '../components/PillLink'
import { searchFreelancers, type AvailabilityStatus, type PublicFreelancerProfile } from '../../lib/api'

const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Open to work',
  BUSY: 'Busy, but open',
  UNAVAILABLE: 'Not taking work',
}

export default function BrowsePage() {
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState<AvailabilityStatus | ''>('')
  const [ordering, setOrdering] = useState('-reputation_score')
  const [profiles, setProfiles] = useState<PublicFreelancerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      setError(null)
      searchFreelancers({
        search: search || undefined,
        availability_status: availability || undefined,
        ordering,
      })
        .then(setProfiles)
        .catch((err) => setError(err?.message || 'Could not load freelancers.'))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [search, availability, ordering])

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/">
          <Logo invert={false} />
        </Link>
        <PillLink href="/signup" variant="dark">
          Get started
        </PillLink>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">
        <h1 className="font-display text-4xl italic md:text-5xl">Browse freelancers</h1>
        <p className="mt-4 max-w-xl text-muted">
          No account needed to look around — this pulls live from the public
          directory.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, headline, or skill…"
            className="min-w-[16rem] flex-1 rounded-pill border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as AvailabilityStatus | '')}
            className="rounded-pill border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
          >
            <option value="">Any availability</option>
            <option value="AVAILABLE">Open to work</option>
            <option value="BUSY">Busy, but open</option>
            <option value="UNAVAILABLE">Not taking work</option>
          </select>
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="rounded-pill border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
          >
            <option value="-reputation_score">Highest reputation</option>
            <option value="-completed_deals">Most deals completed</option>
            <option value="hourly_rate">Lowest rate</option>
            <option value="-hourly_rate">Highest rate</option>
          </select>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error} — is the backend running?
          </div>
        )}

        {!error && !loading && profiles.length === 0 && (
          <p className="mt-10 text-muted">No freelancers match that search.</p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {profiles.map((p) => (
            <Link
              key={p.username}
              href={`/freelancers/${p.username}`}
              className="rounded-2xl border border-ink/10 bg-white/50 p-6 transition-colors hover:border-ink/30"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-full bg-accent" />
                <span className="rounded-pill bg-accent-soft px-3 py-1 text-[11px] text-ink">
                  {AVAILABILITY_LABEL[p.availability_status] ?? p.availability_status}
                </span>
              </div>
              <p className="mt-4 font-display text-lg italic">{p.display_name || p.full_name}</p>
              <p className="text-sm text-muted">{p.headline || p.location}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                <span>{p.hourly_rate ? `${p.currency} ${p.hourly_rate}/hr` : 'Rate not set'}</span>
                <span>{p.completed_deals} deals completed</span>
              </div>
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t.id} className="rounded-pill bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
