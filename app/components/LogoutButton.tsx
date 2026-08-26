'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '../../lib/api'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await logout()
    router.push('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-pill border border-ink/15 px-4 py-2 text-sm text-ink/70 transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
