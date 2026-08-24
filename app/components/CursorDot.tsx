'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CursorDot() {
  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)
  const rotation = useMotionValue(0)

  const arrowX = useSpring(mx, { stiffness: 500, damping: 40, mass: 0.3 })
  const arrowY = useSpring(my, { stiffness: 500, damping: 40, mass: 0.3 })
  const arrowRotate = useSpring(rotation, { stiffness: 200, damping: 20 })

  const last = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)

      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      if (Math.hypot(dx, dy) > 4) {
        rotation.set((Math.atan2(dy, dx) * 180) / Math.PI - 45)
        last.current = { x: e.clientX, y: e.clientY }
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mx, my, rotation])

  return (
    <motion.svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      style={{ x: arrowX, y: arrowY, rotate: arrowRotate, translateX: '-50%', translateY: '-50%' }}
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden mix-blend-difference md:block"
    >
      <path d="M1 1 L19 7 L11 11 L7 19 Z" fill="#F6F4EC" />
    </motion.svg>
  )
}
