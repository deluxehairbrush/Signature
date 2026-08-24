'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Wraps decorative content and nudges it opposite the cursor position,
 * scaled by `strength` — a cheap "3D room" parallax cue. Listens on the
 * whole window so it works no matter where within the panel the cursor is.
 */
export default function ParallaxLayer({
  children,
  strength = 24,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(useTransform(mx, [-1, 1], [-strength, strength]), { stiffness: 60, damping: 16 })
  const y = useSpring(useTransform(my, [-1, 1], [-strength, strength]), { stiffness: 60, damping: 16 })

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  )
}
