'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CursorDot() {
  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)

  const dotX = useSpring(mx, { stiffness: 900, damping: 50, mass: 0.2 })
  const dotY = useSpring(my, { stiffness: 900, damping: 50, mass: 0.2 })
  const ringX = useSpring(mx, { stiffness: 200, damping: 26, mass: 0.5 })
  const ringY = useSpring(my, { stiffness: 200, damping: 26, mass: 0.5 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mx, my])

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ x: ringX, y: ringY }}
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper mix-blend-difference md:block"
      />
      <motion.div
        aria-hidden="true"
        style={{ x: dotX, y: dotY }}
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper mix-blend-difference md:block"
      />
    </>
  )
}
