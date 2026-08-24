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

// Wraps fetch so a network-level failure (backend not running, DNS error,
// CORS block, offline) throws the same ApiError shape as an HTTP error
// response, instead of leaking a raw "Failed to fetch" TypeError.
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch {
    throw { message: 'Could not reach the server. Is the backend running?' } satisfies ApiError
  }
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
  const response = await safeFetch(`${API_BASE}/auth/register/`, {
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
  const response = await safeFetch(`${API_BASE}/auth/login/`, {
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

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = readSession()
  if (!session) {
    throw { message: 'You need to sign in first.' } satisfies ApiError
  }

  const response = await safeFetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.tokens.access}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response
}

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'

export type SocialLinkPlatform =
  | 'GITHUB'
  | 'LINKEDIN'
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'BEHANCE'
  | 'DRIBBBLE'
  | 'WEBSITE'
  | 'OTHER'

export type SocialLink = {
  id: number
  platform: SocialLinkPlatform
  url: string
}

export type Tag = { id: number; name: string }

export type FreelancerProfile = {
  id: number
  username: string
  email: string
  full_name: string
  display_name: string
  headline: string
  bio: string
  location: string
  timezone: string
  hourly_rate: string | null
  currency: string
  availability_status: AvailabilityStatus
  working_hours: string
  reputation_score: number
  completed_deals: number
  successful_deals: number
  tags: Tag[]
  social_links: SocialLink[]
}

export type PublicFreelancerProfile = Omit<
  FreelancerProfile,
  'id' | 'email'
>

export type ClientProfile = {
  id: number
  username: string
  company_name: string
  description: string
  website: string
  location: string
  industry: string
  tags: Tag[]
}

export type PublicClientProfile = Omit<ClientProfile, 'id'>

export type PortfolioItem = {
  id: number
  title: string
  description: string
  project_url: string
  image: string | null
  category: string
  is_public: boolean
}

// A user's own freelancer profile is a list endpoint (one profile max) —
// the backend keys it by request.user, not by id, so "get mine" means
// "get the first (only) item in my own filtered list."
export async function getMyFreelancerProfile(): Promise<FreelancerProfile | null> {
  const response = await authedFetch('/freelancers/profile/')
  const data = await response.json()
  const results = Array.isArray(data) ? data : data.results
  return results?.[0] ?? null
}

export async function createFreelancerProfile(
  input: Partial<FreelancerProfile>,
): Promise<FreelancerProfile> {
  const response = await authedFetch('/freelancers/profile/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function updateFreelancerProfile(
  id: number,
  input: Partial<FreelancerProfile>,
): Promise<FreelancerProfile> {
  const response = await authedFetch(`/freelancers/profile/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function getMyClientProfile(): Promise<ClientProfile | null> {
  const response = await authedFetch('/clients/profile/')
  const data = await response.json()
  const results = Array.isArray(data) ? data : data.results
  return results?.[0] ?? null
}

export async function createClientProfile(
  input: Partial<ClientProfile>,
): Promise<ClientProfile> {
  const response = await authedFetch('/clients/profile/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function updateClientProfile(
  id: number,
  input: Partial<ClientProfile>,
): Promise<ClientProfile> {
  const response = await authedFetch(`/clients/profile/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function getMyPortfolioItems(): Promise<PortfolioItem[]> {
  const response = await authedFetch('/portfolio/')
  const data = await response.json()
  return Array.isArray(data) ? data : data.results
}

export async function createPortfolioItem(
  input: Partial<PortfolioItem>,
): Promise<PortfolioItem> {
  const response = await authedFetch('/portfolio/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function deletePortfolioItem(id: number): Promise<void> {
  await authedFetch(`/portfolio/${id}/`, { method: 'DELETE' })
}

export async function getMySocialLinks(): Promise<SocialLink[]> {
  const response = await authedFetch('/social-links/')
  const data = await response.json()
  return Array.isArray(data) ? data : data.results
}

export async function createSocialLink(input: {
  platform: SocialLinkPlatform
  url: string
}): Promise<SocialLink> {
  const response = await authedFetch('/social-links/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function deleteSocialLink(id: number): Promise<void> {
  await authedFetch(`/social-links/${id}/`, { method: 'DELETE' })
}

export async function getPublicFreelancer(username: string): Promise<PublicFreelancerProfile> {
  const response = await safeFetch(`${API_BASE}/freelancers/${username}/`)
  if (!response.ok) {
    throw await parseError(response)
  }
  const data = await response.json()
  return data.profile
}

export async function getPublicClient(username: string): Promise<PublicClientProfile> {
  const response = await safeFetch(`${API_BASE}/clients/${username}/`)
  if (!response.ok) {
    throw await parseError(response)
  }
  const data = await response.json()
  return data.profile
}

// ---------------------------------------------------------------------------
// AI-assisted deal summarization — these hit this same Next.js app's own
// /api/ai/* routes (lib/ai.ts, Groq-backed), not the Django backend. The
// Django backend has its own /api/v1/ai/summarize-deal/ and /red-flags/
// endpoints, but those simply proxy to these same routes server-to-server
// (see AI_SERVICE_URL in backend/apps/ai_integration/services.py) — calling
// them directly here avoids an extra network hop and an auth requirement
// that isn't needed for a same-origin same-app call.
// ---------------------------------------------------------------------------

export type DealSummary = {
  freelancerName: string | null
  clientName: string | null
  scope: string
  price: number | null
  currency: string
  deadline: string | null
  paymentTerms: string | null
  revisions: string | null
  confidence: 'high' | 'medium' | 'low'
  missingFields: string[]
}

export type RedFlagResult = {
  hasRedFlags: boolean
  flags: { field: string; issue: string }[]
}

export async function aiSummarizeChat(rawText: string): Promise<DealSummary> {
  const response = await safeFetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  })
  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw { message: data.error || data.fallbackMessage || 'AI summarization failed.' } satisfies ApiError
  }
  return data.deal
}

export async function aiCheckRedFlags(deal: DealSummary): Promise<RedFlagResult> {
  const response = await safeFetch('/api/ai/redflags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal }),
  })
  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw { message: data.error || data.fallbackMessage || 'Red-flag check failed.' } satisfies ApiError
  }
  return data.result
}

// ---------------------------------------------------------------------------
// Deals — the Django backend's real deal lifecycle
// ---------------------------------------------------------------------------

export type DealStatus = 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'

export type Deal = {
  id: number
  public_id: string
  client: number
  client_username: string
  freelancer: number | null
  freelancer_username: string | null
  title: string
  description: string
  scope: string
  deliverables: string
  compensation_amount: string | null
  currency: string
  deadline: string | null
  working_hours: string
  terms: string
  status: DealStatus
  tags: Tag[]
  created_at: string
}

export type DealListItem = Pick<
  Deal,
  | 'id'
  | 'public_id'
  | 'title'
  | 'client_username'
  | 'freelancer_username'
  | 'compensation_amount'
  | 'currency'
  | 'status'
  | 'deadline'
  | 'created_at'
  | 'tags'
>

export async function createDeal(input: {
  title: string
  description?: string
  scope?: string
  deliverables?: string
  compensation_amount?: number | null
  currency?: string
  deadline?: string | null
  working_hours?: string
  terms?: string
}): Promise<Deal> {
  const response = await authedFetch('/deals/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  const created = await response.json()

  // DealCreateSerializer's fields don't include id/public_id, so the create
  // response has no way to address the new deal. Fall back to the list
  // endpoint (ordered newest-first) to find it.
  if (created.id) {
    return created
  }
  const mine = await listMyDeals()
  return getDeal(mine[0].id)
}

export async function getDeal(id: number): Promise<Deal> {
  const response = await authedFetch(`/deals/${id}/`)
  return response.json()
}

export async function listMyDeals(): Promise<DealListItem[]> {
  const response = await authedFetch('/deals/')
  const data = await response.json()
  return Array.isArray(data) ? data : data.results
}

export type DealAction = 'propose' | 'accept' | 'sign' | 'complete' | 'cancel' | 'dispute'

export async function performDealAction(id: number, action: DealAction): Promise<Deal> {
  const response = await authedFetch(`/deals/${id}/${action}/`, { method: 'POST' })
  const data = await response.json()
  return data.deal
}
