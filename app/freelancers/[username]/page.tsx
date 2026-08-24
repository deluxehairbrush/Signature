'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'
import PillLink from '../../components/PillLink'
import { getPublicFreelancer, type PublicFreelancerProfile, type ApiError } from '../../../lib/api'

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Open to work',
  BUSY: 'Busy, but open to offers',
  UNAVAILABLE: 'Not taking work right now',
}

export default function FreelancerPublicProfile() {
  const params = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicFreelancerProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicFreelancer(params.username)
      .then(setProfile)
      .catch((err: ApiError) => setError(err.message || 'Could not load this profile.'))
      .finally(() => setLoading(false))
  }, [params.username])

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/">
          <Logo invert={false} />
        </Link>
        <PillLink href="/browse" variant="light">
          Browse more
        </PillLink>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        {loading && <p className="text-muted">Loading…</p>}

        {!loading && error && (
          <div className="rounded-2xl border border-ink/10 bg-white/50 p-8">
            <p className="font-display text-2xl italic">Couldn&apos;t load @{params.username}</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted">@{profile.username}</p>
                <h1 className="mt-1 font-display text-4xl italic">
                  {profile.display_name || profile.full_name}
                </h1>
                {profile.headline && <p className="mt-2 text-lg text-ink/70">{profile.headline}</p>}
              </div>
              <span className="shrink-0 rounded-pill bg-accent-soft px-4 py-1.5 text-xs text-ink">
                {AVAILABILITY_LABEL[profile.availability_status] ?? profile.availability_status}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted">
              {profile.location && <span>{profile.location}</span>}
              {profile.hourly_rate && (
                <span>
                  {profile.currency} {profile.hourly_rate}/hr
                </span>
              )}
              {profile.working_hours && <span>{profile.working_hours}</span>}
            </div>

            {profile.bio && <p className="mt-6 max-w-xl leading-relaxed text-ink/80">{profile.bio}</p>}

            <div className="mt-8 flex gap-8 rounded-2xl border border-ink/10 bg-white/50 p-6">
              <div>
                <p className="font-display text-3xl italic">{profile.reputation_score}</p>
                <p className="text-xs text-muted">Reputation score</p>
              </div>
              <div>
                <p className="font-display text-3xl italic">{profile.completed_deals}</p>
                <p className="text-xs text-muted">Deals completed</p>
              </div>
              <div>
                <p className="font-display text-3xl italic">{profile.successful_deals}</p>
                <p className="text-xs text-muted">Successful deals</p>
              </div>
            </div>

            {profile.social_links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {profile.social_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-pill border border-ink/15 px-4 py-2 text-sm hover:border-ink/40"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            )}

            {profile.social_links.length > 0 ? (
              <a
                href={profile.social_links[0].url}
                target="_blank"
                rel="noreferrer"
                className="mt-10 inline-block rounded-pill bg-ink px-6 py-3 text-sm font-medium text-paper hover:opacity-90"
              >
                Contact {profile.display_name || profile.full_name}
              </a>
            ) : (
              <p className="mt-10 text-sm text-muted">No contact method listed yet.</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
