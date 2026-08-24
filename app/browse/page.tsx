import Link from 'next/link'
import Logo from '../components/Logo'
import PillLink from '../components/PillLink'
import { placeholderProfiles } from '../components/placeholder-data'

export default function BrowsePage() {
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
          No account needed to look around. This directory is still a
          placeholder — it connects to the live public-profile API
          (<code className="text-sm">backend/apps/search</code>) next.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {placeholderProfiles.map((p) => (
            <div key={p.name} className="rounded-2xl border border-ink/10 bg-white/50 p-6">
              <div className="h-10 w-10 rounded-full bg-accent" />
              <p className="mt-4 font-display text-lg italic">{p.name}</p>
              <p className="text-sm text-muted">{p.role}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                <span>{p.rate}</span>
                <span>{p.deals} deals completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
