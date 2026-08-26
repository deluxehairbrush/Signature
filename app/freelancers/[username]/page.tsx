'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LogoLink from '../../components/LogoLink'
import PillLink from '../../components/PillLink'
import {
  addToShortlist,
  getPublicFreelancer,
  getPublicPortfolio,
  getPublicReputation,
  listShortlist,
  readSession,
  removeFromShortlist,
  type PublicFreelancerProfile,
  type PublicPortfolioItem,
  type Reputation,
  type ApiError,
} from '../../../lib/api'

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Open to work',
  BUSY: 'Busy, but open to offers',
  UNAVAILABLE: 'Not taking work right now',
}

// Social links don't have a "this is my contact method" flag — platform is
// just where the URL points, and a WhatsApp/email link can be filed under
// WEBSITE or OTHER (see the "https://wa.me/... or mailto:..." placeholder on
// the profile editor). Prefer an actual contact-capable URL over whichever
// link happens to be first.
function pickContactLink(links: PublicFreelancerProfile['social_links']) {
  if (links.length === 0) return null
  const direct = links.find((l) => l.url.startsWith('mailto:') || l.url.includes('wa.me'))
  return direct ?? links[0]
}

export default function FreelancerPublicProfile() {
  const params = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicFreelancerProfile | null>(null)
  const [portfolio, setPortfolio] = useState<PublicPortfolioItem[]>([])
  const [reputation, setReputation] = useState<Reputation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [shortlistEntryId, setShortlistEntryId] = useState<number | null>(null)
  const [shortlistBusy, setShortlistBusy] = useState(false)
  const isClient = readSession()?.user.user_type === 'CLIENT'

  useEffect(() => {
    getPublicFreelancer(params.username)
      .then(setProfile)
      .catch((err: ApiError) => setError(err.message || 'Could not load this profile.'))
      .finally(() => setLoading(false))
    getPublicPortfolio(params.username).then(setPortfolio).catch(() => {})
    getPublicReputation(params.username).then(setReputation).catch(() => {})
    if (isClient) {
      listShortlist()
        .then((entries) => {
          const match = entries.find((e) => e.freelancer.username === params.username)
          setShortlistEntryId(match ? match.id : null)
        })
        .catch(() => {})
    }
  }, [params.username, isClient])

  async function toggleShortlist() {
    setShortlistBusy(true)
    try {
      if (shortlistEntryId) {
        await removeFromShortlist(shortlistEntryId)
        setShortlistEntryId(null)
      } else {
        const entry = await addToShortlist(params.username)
        setShortlistEntryId(entry.id)
      }
    } catch {
      // no-op — shortlist toggle failures aren't worth surfacing an error banner for
    } finally {
      setShortlistBusy(false)
    }
  }

  const contactLink = profile ? pickContactLink(profile.social_links) : null

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <LogoLink invert={false} />
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

            {profile.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.tags.map((t) => (
                  <span key={t.id} className="rounded-pill bg-ink/5 px-2.5 py-1 text-xs text-ink/60">
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            {profile.completed_deals > 0 ? (
              <div className="mt-8 flex flex-wrap gap-8 rounded-2xl border border-ink/10 bg-white/50 p-6">
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
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white/30 p-6">
                <p className="text-sm text-muted">
                  New here — no completed deals yet. A track record builds up as deals close.
                </p>
              </div>
            )}

            {reputation && reputation.completed_deals > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-ink/10 bg-white/30 p-6 sm:grid-cols-4">
                <div>
                  <p className="font-display text-xl italic">{reputation.on_time_completions}</p>
                  <p className="text-[11px] text-muted">On-time completions</p>
                </div>
                <div>
                  <p className="font-display text-xl italic">{reputation.fair_compensation_count}</p>
                  <p className="text-[11px] text-muted">Fair compensation</p>
                </div>
                <div>
                  <p className="font-display text-xl italic">{reputation.both_confirmed_count}</p>
                  <p className="text-[11px] text-muted">Both sides confirmed</p>
                </div>
                <div>
                  <p className="font-display text-xl italic">{reputation.disputes}</p>
                  <p className="text-[11px] text-muted">Disputes</p>
                </div>
              </div>
            )}

            {portfolio.length > 0 && (
              <div className="mt-10">
                <p className="text-xs uppercase tracking-widest text-muted">Portfolio</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {portfolio.map((item) => (
                    <a
                      key={item.id}
                      href={item.project_url || undefined}
                      target={item.project_url ? '_blank' : undefined}
                      rel="noreferrer"
                      className="block rounded-2xl border border-ink/10 bg-white/50 p-5 hover:border-ink/30"
                    >
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
                      )}
                      <p className="font-display italic">{item.title}</p>
                      {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

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

            <div className="mt-10 flex flex-wrap gap-3">
              <PillLink href={`/deals/new?freelancer=${profile.username}`} variant="dark">
                Hire {profile.display_name || profile.full_name}
              </PillLink>
              {isClient && (
                <button
                  onClick={toggleShortlist}
                  disabled={shortlistBusy}
                  className="inline-flex items-center rounded-pill border border-ink/15 px-6 py-3 text-sm hover:border-ink/40 disabled:opacity-50"
                >
                  {shortlistEntryId ? '★ Saved' : '☆ Save to shortlist'}
                </button>
              )}
              {contactLink && (
                <a
                  href={contactLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-pill border border-ink/15 px-6 py-3 text-sm hover:border-ink/40"
                >
                  Contact directly
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
