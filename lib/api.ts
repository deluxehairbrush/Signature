const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export type UserType = 'FREELANCER' | 'CLIENT'

export type AuthUser = {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  user_type: UserType
}

export type AuthTokens = {
  access: string
  refresh: string
}

export type ApiError = {
  message: string
  fields?: Record<string, string[]>
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json()
    if (data?.error?.message) {
      return { message: data.error.message }
    }
    if (typeof data === 'object' && data !== null) {
      const fieldErrors = data as Record<string, string[] | string>
      const firstKey = Object.keys(fieldErrors)[0]
      if (firstKey) {
        const value = fieldErrors[firstKey]
        const message = Array.isArray(value) ? value[0] : String(value)
        return { message, fields: data as Record<string, string[]> }
      }
    }
  } catch {
    // fall through to generic message
  }
  return { message: `Request failed (${response.status})` }
}

export async function register(input: {
  email: string
  username: string
  first_name: string
  last_name: string
  user_type: UserType
  password: string
  password_confirm: string
}): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json()
}

export async function login(input: {
  email: string
  password: string
}): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json()
}

const TOKEN_STORAGE_KEY = 'signature.auth'

export function storeSession(session: { user: AuthUser; tokens: AuthTokens }) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session))
}

export function readSession(): { user: AuthUser; tokens: AuthTokens } | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}
