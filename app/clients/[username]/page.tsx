'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'
import PillLink from '../../components/PillLink'
import { getPublicClient, type PublicClientProfile, type ApiError } from '../../../lib/api'

export default function ClientPublicProfile() {
  const params = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicClientProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicClient(params.username)
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
            <p className="text-xs uppercase tracking-widest text-muted">@{profile.username}</p>
            <h1 className="mt-1 font-display text-4xl italic">{profile.company_name || profile.username}</h1>

            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted">
              {profile.industry && <span>{profile.industry}</span>}
              {profile.location && <span>{profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-signal hover:underline">
                  {profile.website}
                </a>
              )}
            </div>

            {profile.description && (
              <div className="mt-8 rounded-2xl border border-ink/10 bg-white/50 p-6">
                <p className="text-xs uppercase tracking-widest text-muted">What they&apos;re hiring for</p>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/80">{profile.description}</p>
              </div>
            )}

            <p className="mt-10 text-sm text-muted">
              Collaboration history isn&apos;t tracked on client profiles yet — that lives on the
              freelancer side of each completed deal.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
