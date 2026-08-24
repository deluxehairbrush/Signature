'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '../../components/DashboardShell'
import FormField, { FormTextarea } from '../../components/FormField'
import {
  aiCheckRedFlags,
  aiSummarizeChat,
  createDeal,
  readSession,
  type DealSummary,
  type RedFlagResult,
} from '../../../lib/api'
import { extractTextFromImage, isLowConfidence } from '../../../lib/ocr'

const CONFIDENCE_COLOR: Record<DealSummary['confidence'], string> = {
  high: 'text-accent-dark',
  medium: 'text-signal',
  low: 'text-red-500',
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const match = iso.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

export default function NewDealPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ready, setReady] = useState(false)
  const [rawText, setRawText] = useState('')
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrWarning, setOcrWarning] = useState<string | null>(null)

  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<DealSummary | null>(null)
  const [redFlags, setRedFlags] = useState<RedFlagResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [deadline, setDeadline] = useState('')
  const [terms, setTerms] = useState('')

  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const session = readSession()
    if (!session) {
      router.push('/login')
      return
    }
    setReady(true)
  }, [router])

  async function handleSummarize() {
    if (!rawText.trim()) return
    setError(null)
    setSummarizing(true)
    try {
      const dealSummary = await aiSummarizeChat(rawText)
      setSummary(dealSummary)
      setTitle(dealSummary.scope.slice(0, 60) || 'Untitled deal')
      setScope(dealSummary.scope)
      setAmount(dealSummary.price != null ? String(dealSummary.price) : '')
      setCurrency(dealSummary.currency || 'INR')
      setDeadline(toDateInputValue(dealSummary.deadline))
      setTerms([dealSummary.paymentTerms, dealSummary.revisions].filter(Boolean).join('\n'))

      const flags = await aiCheckRedFlags(dealSummary)
      setRedFlags(flags)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'AI summarization failed.',
      )
    } finally {
      setSummarizing(false)
    }
  }

  async function handleFileUpload(file: File) {
    setOcrBusy(true)
    setOcrWarning(null)
    try {
      const result = await extractTextFromImage(file)
      setRawText((prev) => (prev ? `${prev}\n${result.text}` : result.text))
      if (isLowConfidence(result.confidence)) {
        setOcrWarning('Text quality was low — please double-check the extracted text, especially numbers.')
      }
    } catch {
      setOcrWarning('Could not read that screenshot. Try pasting the text instead.')
    } finally {
      setOcrBusy(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const deal = await createDeal({
        title,
        scope,
        description: rawText,
        compensation_amount: amount ? Number(amount) : null,
        currency,
        deadline: deadline || null,
        terms,
      })
      router.push(`/deals/${deal.id}`)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not reach the server. Is the backend running?',
      )
    } finally {
      setCreating(false)
    }
  }

  if (!ready) {
    return (
      <DashboardShell title="New deal" subtitle="Loading…">
        <div />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Start a deal"
      subtitle="Paste the chat where you agreed on the work — AI pulls out the scope, price, and deadline, and flags anything missing."
    >
      <div className="space-y-3">
        <FormTextarea
          tone="light"
          label="Chat conversation"
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the conversation where you agreed on scope, price, and deadline…"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrBusy}
            className="rounded-pill border border-ink/20 px-4 py-2 text-xs hover:border-ink/50 disabled:opacity-50"
          >
            {ocrBusy ? 'Reading screenshot…' : 'Or upload a screenshot'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing || !rawText.trim()}
            className="rounded-pill bg-ink px-5 py-2 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            {summarizing ? 'Summarizing…' : 'Summarize with AI'}
          </button>
        </div>
        {ocrWarning && <p className="text-xs text-amber-600">{ocrWarning}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {summary && (
        <form onSubmit={handleCreate} className="mt-12 space-y-4 border-t border-ink/10 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl italic">Review before you create it</h2>
            <span className={`text-xs font-medium uppercase tracking-wide ${CONFIDENCE_COLOR[summary.confidence]}`}>
              {summary.confidence} confidence
            </span>
          </div>

          {summary.missingFields.length > 0 && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              AI couldn&apos;t find: {summary.missingFields.join(', ')}. Fill these in below.
            </div>
          )}

          {redFlags && redFlags.hasRedFlags && (
            <div className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">Possible red flags:</p>
              <ul className="mt-1 list-disc pl-5">
                {redFlags.flags.map((f, i) => (
                  <li key={i}>{f.issue}</li>
                ))}
              </ul>
            </div>
          )}

          <FormField tone="light" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <FormTextarea tone="light" label="Scope" rows={3} value={scope} onChange={(e) => setScope(e.target.value)} />

          <div className="grid grid-cols-3 gap-4">
            <FormField tone="light" label="Amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <FormField tone="light" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            <FormField tone="light" label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <FormTextarea tone="light" label="Payment terms & revisions" rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-pill bg-ink py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create deal'}
          </button>
        </form>
      )}
    </DashboardShell>
  )
}
