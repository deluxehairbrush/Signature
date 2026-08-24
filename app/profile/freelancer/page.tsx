'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '../../components/DashboardShell'
import FormField, { FormSelect, FormTextarea } from '../../components/FormField'
import PillLink from '../../components/PillLink'
import {
  createFreelancerProfile,
  createPortfolioItem,
  createSocialLink,
  deletePortfolioItem,
  deleteSocialLink,
  getMyFreelancerProfile,
  getMyPortfolioItems,
  getMySocialLinks,
  readSession,
  updateFreelancerProfile,
  type AvailabilityStatus,
  type PortfolioItem,
  type SocialLink,
  type SocialLinkPlatform,
} from '../../../lib/api'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']
const CATEGORIES = [
  'WEB_DEVELOPMENT',
  'MOBILE_DEVELOPMENT',
  'UI_UX',
  'GRAPHIC_DESIGN',
  'COPYWRITING',
  'VIDEO_EDITING',
  'AI_ML',
  'OTHER',
]
const PLATFORMS: SocialLinkPlatform[] = [
  'GITHUB',
  'LINKEDIN',
  'TWITTER',
  'INSTAGRAM',
  'BEHANCE',
  'DRIBBBLE',
  'WEBSITE',
  'OTHER',
]

export default function FreelancerProfilePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [username, setUsername] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [timezone, setTimezone] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [availability, setAvailability] = useState<AvailabilityStatus>('AVAILABLE')
  const [workingHours, setWorkingHours] = useState('')

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [newPortfolio, setNewPortfolio] = useState({ title: '', description: '', project_url: '', category: 'OTHER' })

  const [socials, setSocials] = useState<SocialLink[]>([])
  const [newSocial, setNewSocial] = useState<{ platform: SocialLinkPlatform; url: string }>({
    platform: 'WEBSITE',
    url: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const session = readSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUsername(session.user.username)

    Promise.all([getMyFreelancerProfile(), getMyPortfolioItems(), getMySocialLinks()])
      .then(([profile, items, links]) => {
        if (profile) {
          setProfileId(profile.id)
          setDisplayName(profile.display_name)
          setHeadline(profile.headline)
          setBio(profile.bio)
          setLocation(profile.location)
          setTimezone(profile.timezone)
          setHourlyRate(profile.hourly_rate ?? '')
          setCurrency(profile.currency)
          setAvailability(profile.availability_status)
          setWorkingHours(profile.working_hours)
        }
        setPortfolio(items)
        setSocials(links)
      })
      .catch(() => {
        // no profile yet, or backend unreachable — stay in create mode
      })
      .finally(() => setReady(true))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setSaved(false)

    const payload = {
      display_name: displayName,
      headline,
      bio,
      location,
      timezone,
      hourly_rate: hourlyRate || null,
      currency,
      availability_status: availability,
      working_hours: workingHours,
    }

    try {
      if (profileId) {
        await updateFreelancerProfile(profileId, payload)
      } else {
        const created = await createFreelancerProfile(payload)
        setProfileId(created.id)
      }
      setSaved(true)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not reach the server. Is the backend running?',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAddPortfolio(e: React.FormEvent) {
    e.preventDefault()
    if (!newPortfolio.title.trim()) return
    try {
      const item = await createPortfolioItem(newPortfolio)
      setPortfolio((prev) => [item, ...prev])
      setNewPortfolio({ title: '', description: '', project_url: '', category: 'OTHER' })
    } catch {
      setError('Could not add that portfolio item — is the backend running?')
    }
  }

  async function handleRemovePortfolio(id: number) {
    setPortfolio((prev) => prev.filter((p) => p.id !== id))
    await deletePortfolioItem(id).catch(() => {})
  }

  async function handleAddSocial(e: React.FormEvent) {
    e.preventDefault()
    if (!newSocial.url.trim()) return
    try {
      const link = await createSocialLink(newSocial)
      setSocials((prev) => [...prev, link])
      setNewSocial({ platform: 'WEBSITE', url: '' })
    } catch {
      setError('Could not add that link — is the backend running?')
    }
  }

  async function handleRemoveSocial(id: number) {
    setSocials((prev) => prev.filter((s) => s.id !== id))
    await deleteSocialLink(id).catch(() => {})
  }

  if (!ready) {
    return (
      <DashboardShell title="Your freelancer profile" subtitle="Loading…">
        <div />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Your freelancer profile"
      subtitle="This is what clients see when they look you up — no account needed on their end."
      action={
        <div className="flex gap-3">
          <PillLink href="/deals" variant="light">
            Your deals
          </PillLink>
          {username && (
            <PillLink href={`/freelancers/${username}`} variant="light">
              View public profile
            </PillLink>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField tone="light" label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <FormField tone="light" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" />
        </div>
        <FormField tone="light" label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Product designer for early-stage startups" />
        <FormTextarea tone="light" label="Bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What you do, who you do it for, and what makes you good at it." />

        <div className="grid grid-cols-3 gap-4">
          <FormField tone="light" label="Hourly rate" type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          <FormSelect tone="light" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FormSelect>
          <FormField tone="light" label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="IST (UTC+5:30)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            tone="light"
            label="Open to work?"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
          >
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy, but open to offers</option>
            <option value="UNAVAILABLE">Not taking work right now</option>
          </FormSelect>
          <FormField tone="light" label="Turnaround / working hours" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="1-2 week turnaround, Mon-Fri" />
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {saved && !error && (
          <div className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-ink">Saved.</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-pill bg-ink py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : profileId ? 'Save changes' : 'Create profile'}
        </button>
      </form>

      <section className="mt-14">
        <h2 className="font-display text-2xl italic">Portfolio</h2>
        <p className="mt-1 text-sm text-muted">Projects you&apos;re proud of showing.</p>

        <div className="mt-6 space-y-3">
          {portfolio.map((item) => (
            <div key={item.id} className="flex items-start justify-between rounded-xl border border-ink/10 bg-white/50 p-4">
              <div>
                <p className="font-medium">{item.title}</p>
                {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
              </div>
              <button type="button" onClick={() => handleRemovePortfolio(item.id)} className="text-xs text-muted hover:text-ink">
                Remove
              </button>
            </div>
          ))}
          {portfolio.length === 0 && <p className="text-sm text-muted">Nothing added yet.</p>}
        </div>

        <form onSubmit={handleAddPortfolio} className="mt-6 space-y-3 rounded-xl border border-dashed border-ink/15 p-4">
          <FormField tone="light" label="Project title" value={newPortfolio.title} onChange={(e) => setNewPortfolio((p) => ({ ...p, title: e.target.value }))} />
          <FormTextarea tone="light" label="Description" rows={2} value={newPortfolio.description} onChange={(e) => setNewPortfolio((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <FormField tone="light" label="Project URL" value={newPortfolio.project_url} onChange={(e) => setNewPortfolio((p) => ({ ...p, project_url: e.target.value }))} />
            <FormSelect tone="light" label="Category" value={newPortfolio.category} onChange={(e) => setNewPortfolio((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </FormSelect>
          </div>
          <button type="submit" className="rounded-pill border border-ink/20 px-5 py-2 text-sm hover:border-ink/50">
            Add project
          </button>
        </form>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl italic">Contact &amp; socials</h2>
        <p className="mt-1 text-sm text-muted">How clients reach you once they&apos;re interested.</p>

        <div className="mt-6 space-y-2">
          {socials.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/50 px-4 py-3">
              <span className="text-sm"><span className="text-muted">{link.platform}</span> — {link.url}</span>
              <button type="button" onClick={() => handleRemoveSocial(link.id)} className="text-xs text-muted hover:text-ink">
                Remove
              </button>
            </div>
          ))}
          {socials.length === 0 && <p className="text-sm text-muted">Nothing added yet.</p>}
        </div>

        <form onSubmit={handleAddSocial} className="mt-6 flex gap-3 rounded-xl border border-dashed border-ink/15 p-4">
          <FormSelect
            tone="light"
            label="Platform"
            value={newSocial.platform}
            onChange={(e) => setNewSocial((s) => ({ ...s, platform: e.target.value as SocialLinkPlatform }))}
            className="w-40 shrink-0"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </FormSelect>
          <div className="flex-1">
            <FormField tone="light" label="Link" value={newSocial.url} onChange={(e) => setNewSocial((s) => ({ ...s, url: e.target.value }))} placeholder="https://wa.me/... or mailto:you@example.com" />
          </div>
          <button type="submit" className="mt-6 h-fit rounded-pill border border-ink/20 px-5 py-3 text-sm hover:border-ink/50">
            Add
          </button>
        </form>
      </section>
    </DashboardShell>
  )
}
