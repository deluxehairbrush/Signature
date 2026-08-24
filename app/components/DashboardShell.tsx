import Link from 'next/link'
import Logo from './Logo'
import type { ReactNode } from 'react'

export default function DashboardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/">
          <Logo invert={false} />
        </Link>
        {action}
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10">
        <h1 className="font-display text-4xl italic">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  )
}
