'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardShell from '../../components/DashboardShell'
import {
  getDeal,
  getDealCompletions,
  getDealDispute,
  getDealMessages,
  performDealAction,
  raiseDealDispute,
  readSession,
  resolveDealDispute,
  sendDealMessage,
  submitDealCompletion,
  type CompletionConfirmation,
  type Deal,
  type DealAction,
  type DealDispute,
  type DealMessage,
  type DisputeOutcome,
} from '../../../lib/api'

const OUTCOME_LABEL: Record<DisputeOutcome, string> = {
  REFUND_CLIENT: 'Refund the client',
  PROCEED_AS_IS: 'Proceed with the work as-is',
  CANCEL_DEAL: 'Cancel the deal',
}

const STATUS_LABEL: Record<Deal['status'], string> = {
  DRAFT: 'Draft',
  PROPOSED: 'Proposed',
  ACCEPTED: 'Accepted',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
}

const ACTIONS_FOR_STATUS: Record<Deal['status'], { action: DealAction; label: string }[]> = {
  DRAFT: [{ action: 'propose', label: 'Propose to freelancer' }],
  PROPOSED: [
    { action: 'accept', label: 'Accept' },
    { action: 'cancel', label: 'Cancel' },
  ],
  ACCEPTED: [
    { action: 'sign', label: 'Sign' },
    { action: 'complete', label: 'Mark complete' },
    { action: 'cancel', label: 'Cancel' },
  ],
  ACTIVE: [
    { action: 'complete', label: 'Mark complete' },
    { action: 'cancel', label: 'Cancel' },
  ],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
}

export default function DealDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<DealAction | null>(null)

  const [completions, setCompletions] = useState<CompletionConfirmation[]>([])
  const [reviewForm, setReviewForm] = useState({
    completed_on_time: true,
    compensation_received: true,
    compensation_fair: true,
    work_satisfactory: true,
    comment: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const myUserId = readSession()?.user.id

  const [messages, setMessages] = useState<DealMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  const [dispute, setDispute] = useState<DealDispute | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [submittingDispute, setSubmittingDispute] = useState(false)
  const [resolveOutcome, setResolveOutcome] = useState<DisputeOutcome>('PROCEED_AS_IS')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolvingDispute, setResolvingDispute] = useState(false)

  const load = useCallback(() => {
    getDeal(Number(params.id))
      .then((d) => {
        setDeal(d)
        if (d.status === 'COMPLETED') {
          getDealCompletions(d.id).then(setCompletions).catch(() => {})
        }
        getDealMessages(d.id).then(setMessages).catch(() => {})
        if (d.freelancer_username) {
          getDealDispute(d.id).then(setDispute).catch(() => {})
        }
      })
      .catch((err) => setError(err?.message || 'Could not load this deal.'))
  }, [params.id])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() && !attachment) return
    setSendingMessage(true)
    try {
      const message = await sendDealMessage(Number(params.id), newMessage, attachment)
      setMessages((prev) => [...prev, message])
      setNewMessage('')
      setAttachment(null)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not send that message.',
      )
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleRaiseDispute(e: React.FormEvent) {
    e.preventDefault()
    if (!disputeReason.trim()) return
    setSubmittingDispute(true)
    setError(null)
    try {
      const created = await raiseDealDispute(Number(params.id), disputeReason)
      setDispute(created)
      setDisputeReason('')
      setShowDisputeForm(false)
      load()
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not raise a dispute on this deal.',
      )
    } finally {
      setSubmittingDispute(false)
    }
  }

  async function handleResolveDispute(e: React.FormEvent) {
    e.preventDefault()
    setResolvingDispute(true)
    setError(null)
    try {
      const resolved = await resolveDealDispute(Number(params.id), {
        outcome: resolveOutcome,
        resolution_notes: resolveNotes,
      })
      setDispute(resolved)
      load()
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not resolve this dispute.',
      )
    } finally {
      setResolvingDispute(false)
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      const confirmation = await submitDealCompletion(Number(params.id), reviewForm)
      setCompletions((prev) => [confirmation, ...prev])
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not submit that confirmation.',
      )
    } finally {
      setSubmittingReview(false)
    }
  }

  useEffect(() => {
    if (!readSession()) {
      router.push('/login')
      return
    }
    load()
  }, [router, load])

  async function handleAction(action: DealAction) {
    setBusy(action)
    setError(null)
    try {
      const updated = await performDealAction(Number(params.id), action)
      setDeal(updated)
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : `Could not ${action} this deal.`,
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell title="Deal" subtitle={deal ? deal.title : 'Loading…'}>
      {error && (
        <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!deal && !error && <p className="text-muted">Loading…</p>}

      {deal && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/50 p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Status</p>
              <p className="mt-1 font-display text-2xl italic">{STATUS_LABEL[deal.status]}</p>
            </div>
            <div className="text-right text-sm text-muted">
              <p>{deal.client_username} → {deal.freelancer_username || 'unassigned'}</p>
              {deal.compensation_amount && (
                <p className="mt-1 font-medium text-ink">
                  {deal.currency} {deal.compensation_amount}
                </p>
              )}
            </div>
          </div>

          {deal.scope && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Scope</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{deal.scope}</p>
            </div>
          )}

          {deal.terms && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Terms</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{deal.terms}</p>
            </div>
          )}

          {deal.deadline && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Deadline</p>
              <p className="mt-1 text-sm text-ink/80">{new Date(deal.deadline).toLocaleDateString()}</p>
            </div>
          )}

          {deal.freelancer_username && (
            <div className="border-t border-ink/10 pt-6">
              <p className="text-xs uppercase tracking-widest text-muted">Messages</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.sender === myUserId ? 'ml-auto bg-ink text-paper' : 'bg-white/60'
                    }`}
                  >
                    {m.sender !== myUserId && (
                      <p className="mb-0.5 text-[11px] opacity-60">{m.sender_username}</p>
                    )}
                    {m.body}
                    {m.attachment && (
                      <a
                        href={m.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-1 block truncate text-xs underline ${
                          m.sender === myUserId ? 'text-paper/80' : 'text-signal'
                        }`}
                      >
                        📎 {m.attachment.split('/').pop()}
                      </a>
                    )}
                  </div>
                ))}
                {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
              </div>
              <form onSubmit={handleSendMessage} className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message about this deal…"
                    className="flex-1 rounded-pill border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="rounded-pill bg-ink px-5 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
                  >
                    {sendingMessage ? 'Sending…' : 'Send'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <label className="cursor-pointer rounded-pill border border-ink/15 px-3 py-1 hover:border-ink/40">
                    Attach file
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {attachment && (
                    <span className="flex items-center gap-1">
                      {attachment.name}
                      <button type="button" onClick={() => setAttachment(null)} className="text-red-500">
                        ✕
                      </button>
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {(dispute || deal.status === 'ACCEPTED' || deal.status === 'ACTIVE' || deal.status === 'DISPUTED') && (
            <div className="border-t border-ink/10 pt-6">
              <p className="text-xs uppercase tracking-widest text-muted">Dispute</p>

              {dispute ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-red-400/30 bg-red-50 p-4 text-sm">
                    <p className="text-xs text-muted">Raised by {dispute.raised_by_username}</p>
                    <p className="mt-1 text-ink/80">{dispute.reason}</p>
                  </div>
                  {dispute.is_resolved ? (
                    <div className="rounded-xl border border-ink/10 bg-white/50 p-4 text-sm">
                      <p className="font-medium">Resolved: {OUTCOME_LABEL[dispute.outcome as DisputeOutcome]}</p>
                      {dispute.resolution_notes && (
                        <p className="mt-1 text-ink/70">{dispute.resolution_notes}</p>
                      )}
                      {dispute.resolved_by_username && (
                        <p className="mt-1 text-xs text-muted">by {dispute.resolved_by_username}</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleResolveDispute} className="space-y-3 rounded-xl border border-dashed border-ink/15 p-4">
                      <p className="text-sm font-medium">Resolve this dispute</p>
                      <select
                        value={resolveOutcome}
                        onChange={(e) => setResolveOutcome(e.target.value as DisputeOutcome)}
                        className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
                      >
                        {(Object.keys(OUTCOME_LABEL) as DisputeOutcome[]).map((key) => (
                          <option key={key} value={key}>
                            {OUTCOME_LABEL[key]}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        placeholder="Resolution notes (optional)"
                        rows={2}
                        className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
                      />
                      <button
                        type="submit"
                        disabled={resolvingDispute}
                        className="rounded-pill bg-ink px-5 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
                      >
                        {resolvingDispute ? 'Resolving…' : 'Submit resolution'}
                      </button>
                    </form>
                  )}
                </div>
              ) : showDisputeForm ? (
                <form onSubmit={handleRaiseDispute} className="mt-3 space-y-3 rounded-xl border border-dashed border-ink/15 p-4">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="What went wrong?"
                    rows={2}
                    required
                    className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingDispute}
                      className="rounded-pill bg-ink px-5 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
                    >
                      {submittingDispute ? 'Submitting…' : 'Submit dispute'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(false)}
                      className="rounded-pill border border-ink/20 px-5 py-2 text-sm hover:border-ink/50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="mt-3 rounded-pill border border-red-400/40 px-5 py-2 text-sm text-red-600 hover:border-red-400"
                >
                  Raise a dispute
                </button>
              )}
            </div>
          )}

          {deal.status === 'COMPLETED' && (
            <div className="border-t border-ink/10 pt-6">
              <p className="text-xs uppercase tracking-widest text-muted">Confirmations</p>

              <div className="mt-3 space-y-3">
                {completions.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ink/10 bg-white/50 p-4 text-sm">
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                      <span>{c.completed_on_time ? '✓ On time' : '✕ Not on time'}</span>
                      <span>{c.compensation_fair ? '✓ Fair pay' : '✕ Pay not fair'}</span>
                      <span>{c.work_satisfactory ? '✓ Satisfactory' : '✕ Not satisfactory'}</span>
                    </div>
                    {c.comment && <p className="mt-2 text-ink/80">{c.comment}</p>}
                  </div>
                ))}
                {completions.length === 0 && (
                  <p className="text-sm text-muted">No confirmations submitted yet.</p>
                )}
              </div>

              {!completions.some((c) => c.submitted_by === myUserId) && (
                <form onSubmit={handleSubmitReview} className="mt-4 space-y-3 rounded-xl border border-dashed border-ink/15 p-4">
                  <p className="text-sm font-medium">Confirm what happened</p>
                  {[
                    ['completed_on_time', 'Completed on time'],
                    ['compensation_received', 'Compensation received'],
                    ['compensation_fair', 'Compensation was fair'],
                    ['work_satisfactory', 'Work was satisfactory'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={reviewForm[key as keyof typeof reviewForm] as boolean}
                        onChange={(e) =>
                          setReviewForm((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Anything worth noting for future clients or freelancers?"
                    rows={2}
                    className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none focus:border-signal"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-pill bg-ink px-5 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting…' : 'Submit confirmation'}
                  </button>
                </form>
              )}
            </div>
          )}

          {deal.status !== 'DISPUTED' && (
            <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-6">
              {ACTIONS_FOR_STATUS[deal.status].map(({ action, label }) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  disabled={busy !== null}
                  className="rounded-pill border border-ink/20 px-5 py-2 text-sm hover:border-ink/50 disabled:opacity-50"
                >
                  {busy === action ? 'Working…' : label}
                </button>
              ))}
              {ACTIONS_FOR_STATUS[deal.status].length === 0 && (
                <p className="text-sm text-muted">This deal is in a final state — no further actions.</p>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
