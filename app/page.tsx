import Link from 'next/link'
import LandingExperience from './components/LandingExperience'

export default function Home() {
  return (
    <main>
      <LandingExperience />

      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} Signature</span>
          <div className="flex gap-6">
            <Link href="/how-it-works" className="hover:text-ink">How it works</Link>
            <Link href="/browse" className="hover:text-ink">Browse</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
