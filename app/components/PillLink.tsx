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
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-pill px-4 py-2 text-xs font-medium transition-colors sm:px-6 sm:py-3 sm:text-sm ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
