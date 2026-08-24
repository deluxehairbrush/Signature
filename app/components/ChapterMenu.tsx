'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { chapters, bgClass } from './chapters'
import Logo from './Logo'
import PillLink from './PillLink'

type ChapterMenuProps = {
  open: boolean
  onClose: () => void
  active: number
  onJump: (index: number) => void
}

export default function ChapterMenu({ open, onClose, active, onJump }: ChapterMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-ink p-8 text-paper shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <Logo className="text-paper" />
                <h2 className="mt-4 font-display text-3xl italic">
                  The Signature
                  <br />
                  journey
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full border border-paper/20 px-3 py-1 text-sm hover:border-paper/50"
              >
                ✕
              </button>
            </div>

            <PillLink href="/browse" variant="accent" className="mt-6 w-fit">
              Browse profiles
            </PillLink>

            <div className="mt-8 space-y-3">
              {chapters.map((c, i) => (
                <button
                  key={c.key}
                  onClick={() => {
                    onJump(i)
                    onClose()
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${
                    i === active ? 'bg-paper text-ink' : 'hover:bg-paper/10'
                  }`}
                >
                  <span className={`h-10 w-10 shrink-0 rounded-lg ${bgClass[c.bg]}`} />
                  <span className="flex-1">
                    <span className="block text-xs uppercase tracking-widest opacity-60">
                      Chapter {c.index}
                    </span>
                    <span className="font-display text-lg italic">{c.title}</span>
                  </span>
                  <span className="text-xs opacity-50">{c.range}</span>
                </button>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-6 flex items-center gap-3 rounded-2xl border border-paper/15 p-4 text-sm hover:border-paper/40"
            >
              <span className="h-10 w-10 shrink-0 rounded-lg bg-paper/10" />
              <span>
                Ready to be found?
                <br />
                <span className="opacity-60">Create your profile →</span>
              </span>
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
