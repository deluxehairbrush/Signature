'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '../../components/DashboardShell'
import FormField, { FormTextarea } from '../../components/FormField'
import PillLink from '../../components/PillLink'
import {
  createClientProfile,
  getMyClientProfile,
  readSession,
  updateClientProfile,
} from '../../../lib/api'

export default function ClientProfilePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [username, setUsername] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

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

    getMyClientProfile()
      .then((profile) => {
        if (!profile) return
        setProfileId(profile.id)
        setCompanyName(profile.company_name)
        setWebsite(profile.website)
        setIndustry(profile.industry)
        setLocation(profile.location)
        setDescription(profile.description)
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
      company_name: companyName,
      website,
      industry,
      location,
      description,
    }

    try {
      if (profileId) {
        await updateClientProfile(profileId, payload)
      } else {
        const created = await createClientProfile(payload)
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

  if (!ready) {
    return (
      <DashboardShell title="Your client profile" subtitle="Loading…">
        <div />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Your client profile"
      subtitle="What freelancers see before they say yes to working with you."
      action={
        <div className="flex gap-3">
          <PillLink href="/deals" variant="light">
            Your deals
          </PillLink>
          {username && (
            <PillLink href={`/clients/${username}`} variant="light">
              View public profile
            </PillLink>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField tone="light" label="Company / your name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <FormField tone="light" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote, or a city" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField tone="light" label="Industry / area you're hiring for" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="E-commerce, SaaS, design…" />
          <FormField tone="light" label="Website or link" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
        <FormTextarea
          tone="light"
          label="What are you hiring for?"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What you need done, your budget or rate range, your deadline, and what a good fit looks like. This is the freeform pitch freelancers will read first."
        />

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
    </DashboardShell>
  )
}
