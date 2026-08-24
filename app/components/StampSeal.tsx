'use client'

import { AnimatePresence, motion } from 'framer-motion'

export default function StampSeal({
  show,
  label = 'Deal issued',
}: {
  show: boolean
  label?: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, mass: 0.7 }}
            className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-accent bg-paper text-ink shadow-2xl md:h-52 md:w-52"
          >
            <motion.svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 14 }}
            >
              <path d="M4 12.5 L9.5 18 L20 6" stroke="#86C22A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-center font-display text-sm italic leading-tight md:text-lg"
            >
              {label}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
