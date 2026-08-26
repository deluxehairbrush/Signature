'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { register, storeSession, type UserType } from '../../lib/api'

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const initialType: UserType = params.get('as') === 'client' ? 'CLIENT' : 'FREELANCER'

  const [userType, setUserType] = useState<UserType>(initialType)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const session = await register({
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        password,
        password_confirm: passwordConfirm,
      })
      storeSession(session)
      router.push(userType === 'FREELANCER' ? '/profile/freelancer' : '/profile/client')
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not reach the server. Is the backend running?'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your profile"
      subtitle="Two minutes. Public by default, editable anytime."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 flex gap-2 rounded-pill bg-paper/5 p-1">
        {(['FREELANCER', 'CLIENT'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setUserType(type)}
            className={`flex-1 rounded-pill py-2 text-sm font-medium transition-colors ${
              userType === type ? 'bg-accent text-ink' : 'text-paper/60 hover:text-paper'
            }`}
          >
            {type === 'FREELANCER' ? "I'm a freelancer" : "I'm hiring"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <FormField
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <FormField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <FormField
          label="Confirm password"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          minLength={8}
          required
        />

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-pill bg-accent py-3 text-sm font-medium text-ink transition-opacity hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? 'Creating your profile…' : 'Create profile'}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-paper/30">
          <span className="h-px flex-1 bg-paper/15" />
          or
          <span className="h-px flex-1 bg-paper/15" />
        </div>

        <GoogleSignInButton userType={userType} />
      </form>
    </AuthShell>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}
