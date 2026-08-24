'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { chapters } from './chapters'

export default function BottomPill({ active }: { active: number }) {
  const chapter = chapters[active]
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center">
      <Link href="/signup" className="pointer-events-auto">
        <div className="flex items-center gap-3 rounded-pill bg-ink/90 px-6 py-3 text-sm text-paper shadow-lg backdrop-blur">
          <span aria-hidden="true">✦</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={chapter.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="whitespace-nowrap"
            >
              {chapter.pill}
            </motion.span>
          </AnimatePresence>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink">+</span>
        </div>
      </Link>
    </div>
  )
}
