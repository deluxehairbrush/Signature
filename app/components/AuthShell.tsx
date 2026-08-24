import Link from 'next/link'
import Logo from './Logo'
import type { ReactNode } from 'react'

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-8 font-display text-4xl italic">{title}</h1>
        <p className="mt-2 text-sm text-paper/60">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-center text-sm text-paper/50">{footer}</p>
      </div>
    </main>
  )
}
