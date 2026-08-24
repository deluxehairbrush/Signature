'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  listNotifications,
  markAllNotificationsRead,
  readSession,
  type Notification,
} from '../../lib/api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!readSession()) return
    listNotifications().then(setNotifications).catch(() => {})
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!readSession()) return null

  const unread = notifications.filter((n) => !n.is_read).length

  async function handleOpen() {
    setOpen((v) => !v)
    if (unread > 0) {
      await markAllNotificationsRead().catch(() => {})
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-ink/40"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[10px] text-paper">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-ink/10 bg-paper p-2 shadow-xl">
          {notifications.length === 0 && (
            <p className="p-4 text-sm text-muted">Nothing yet.</p>
          )}
          {notifications.slice(0, 10).map((n) => (
            <Link
              key={n.id}
              href={`/deals/${n.deal}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl p-3 text-sm hover:bg-ink/5"
            >
              <p>{n.message}</p>
              <p className="mt-0.5 text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
