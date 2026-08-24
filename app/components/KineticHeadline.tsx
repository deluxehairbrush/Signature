'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function KineticHeadline({
  lines,
  className = '',
}: {
  lines: ReactNode[]
  className?: string
}) {
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: '110%', rotate: 4 }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}
