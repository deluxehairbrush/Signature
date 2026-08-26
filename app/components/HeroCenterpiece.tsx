'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import FloatingShape from './FloatingShape'
import PyramidShape from './PyramidShape'
import RingShape from './RingShape'

const ORBIT_SHAPES = [
  { shape: 'cube', size: 50, color: '#F6F4EC', angle: 10, radius: 210, duration: 9 },
  { shape: 'pyramid', size: 60, color: '#7C3AED', angle: 135, radius: 175, duration: 13 },
  { shape: 'cube', size: 64, color: '#86C22A', angle: 250, radius: 235, duration: 12 },
] as const

/**
 * Hero-scale replacement for the scattered corner shapes: a large central
 * cube orbited by smaller ones, plus a mouse-driven tilt on the whole
 * cluster for an extra layer of depth beyond the orbit's own spin.
 */
export default function HeroCenterpiece({ className = '' }: { className?: string }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-1, 1], [16, -16]), { stiffness: 45, damping: 14 })
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-22, 22]), { stiffness: 45, damping: 14 })

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  return (
    <div className={`pointer-events-none ${className}`} style={{ perspective: 1600 }}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {ORBIT_SHAPES.map((s, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${s.angle}deg) translateX(${s.radius}px) rotate(-${s.angle}deg)` }}
            >
              {s.shape === 'pyramid' ? (
                <PyramidShape size={s.size} color={s.color} duration={s.duration} />
              ) : (
                <FloatingShape size={s.size} color={s.color} duration={s.duration} />
              )}
            </div>
          ))}
        </motion.div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <RingShape size={340} color="#C7F464" dotCount={0} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />
          <FloatingShape size={220} color="#C7F464" duration={22} />
        </div>
      </motion.div>
    </div>
  )
}
