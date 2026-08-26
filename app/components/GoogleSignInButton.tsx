'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { googleAuth, storeSession, type UserType } from '../../lib/api'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

/**
 * Google "Sign in with Google" button using Identity Services' ID-token
 * flow (no client secret needed on either end for this). Renders a
 * disabled placeholder until NEXT_PUBLIC_GOOGLE_CLIENT_ID is actually set.
 */
export default function GoogleSignInButton({ userType }: { userType?: UserType }) {
  const router = useRouter()
  const buttonRef = useRef<HTMLDivElement>(null)
  const userTypeRef = useRef(userType)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    userTypeRef.current = userType
  }, [userType])

  useEffect(() => {
    if (!scriptLoaded || !clientId || !window.google || !buttonRef.current) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setError(null)
        try {
          const session = await googleAuth(response.credential, userTypeRef.current)
          storeSession(session)
          router.push(session.user.user_type === 'FREELANCER' ? '/profile/freelancer' : '/profile/client')
        } catch (err) {
          setError(
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : 'Google sign-in failed.',
          )
        }
      },
    })
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
    })
  }, [scriptLoaded, clientId, router])

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in is coming soon"
        className="flex w-full items-center justify-center gap-2 rounded-pill border border-paper/15 py-3 text-sm text-paper/40"
      >
        Continue with Google — coming soon
      </button>
    )
  }

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} className="flex justify-center" />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
