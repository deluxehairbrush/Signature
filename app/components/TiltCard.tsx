'use client'

import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { ReactNode, MouseEvent } from 'react'

export default function TiltCard({
  children,
  className = '',
  intensity = 14,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const spring = { stiffness: 220, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), spring)
  const glowX = useTransform(px, [0, 1], ['0%', '100%'])
  const glowY = useTransform(py, [0, 1], ['0%', '100%'])
  const glowBackground = useMotionTemplate`radial-gradient(320px circle at ${glowX} ${glowY}, rgba(199,244,100,0.25), transparent 70%)`

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />
        <div style={{ transform: 'translateZ(28px)', transformStyle: 'preserve-3d' }} className="h-full w-full">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
