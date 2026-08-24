import Link from 'next/link'
import type { ReactNode } from 'react'

type PillLinkProps = {
  href: string
  children: ReactNode
  variant?: 'dark' | 'light' | 'accent'
  className?: string
}

const variants = {
  dark: 'bg-ink text-paper hover:bg-ink-soft',
  light: 'bg-paper text-ink border border-ink/15 hover:border-ink/40',
  accent: 'bg-accent text-ink hover:bg-accent-dark',
}

export default function PillLink({
  href,
  children,
  variant = 'dark',
  className = '',
}: PillLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-pill px-6 py-3 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
