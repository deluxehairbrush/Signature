'use client'

import { motion } from 'framer-motion'

export default function KineticHeadline({
  lines,
  className = '',
}: {
  lines: string[]
  className?: string
}) {
  let wordIndex = 0
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden py-1">
          {line.split(' ').map((word, j) => {
            const idx = wordIndex++
            return (
              <span key={j} className="inline-block overflow-hidden pb-2 pr-[0.28em] align-top">
                <motion.span
                  className="inline-block"
                  initial={{ y: '130%', rotate: 10, skewY: 8 }}
                  animate={{ y: '0%', rotate: 0, skewY: 0 }}
                  transition={{ duration: 1.05, delay: 0.1 + idx * 0.055, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}
