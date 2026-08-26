'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { readSession, logout, type AuthUser } from '../../lib/api'

// Shows the signed-out `children` (Sign in / Get started pills) until we know
// otherwise, then swaps to an avatar + dropdown once a session is found.
// Session lives in localStorage only, so this can't be determined during SSR —
// `user` starts `undefined` and we don't render either state until the client
// effect resolves it, avoiding a signed-out flash for signed-in users.
export default function AccountNav({
  variant = 'light',
  children,
}: {
  variant?: 'light' | 'dark'
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(readSession()?.user ?? null)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  if (user === undefined) return null
  if (!user) return <>{children}</>

  const initial = (user.first_name || user.username || user.email || '?').charAt(0).toUpperCase()
  const profileHref = user.user_type === 'FREELANCER' ? '/profile/freelancer' : '/profile/client'
  const isLight = variant === 'light'

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push('/login')
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
          isLight ? 'bg-ink text-paper hover:bg-ink-soft' : 'bg-paper text-ink hover:opacity-90'
        }`}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-2xl border py-1 text-sm shadow-lg ${
            isLight ? 'border-ink/10 bg-paper text-ink' : 'border-paper/10 bg-ink text-paper'
          }`}
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 transition-colors hover:bg-ink/5"
          >
            Your profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left transition-colors hover:bg-ink/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
