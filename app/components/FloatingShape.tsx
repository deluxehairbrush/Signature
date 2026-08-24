'use client'

import { motion } from 'framer-motion'

type FloatingShapeProps = {
  size?: number
  color?: string
  className?: string
  duration?: number
  delay?: number
}

/**
 * A continuously-rotating isometric cube built from three CSS faces.
 * Purely decorative depth — no reference imagery, just perspective + rotateX/Y.
 */
export default function FloatingShape({
  size = 120,
  color = '#C7F464',
  className = '',
  duration = 14,
  delay = 0,
}: FloatingShapeProps) {
  const half = size / 2
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, perspective: 800 }}
    >
      <motion.div
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
        animate={{ rotateX: [15, 25, 15], rotateY: [0, 360] }}
        transition={{
          rotateY: { duration, repeat: Infinity, ease: 'linear', delay },
          rotateX: { duration: duration / 2, repeat: Infinity, ease: 'easeInOut', delay },
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color,
            opacity: 0.9,
            transform: `translateZ(${half}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color,
            opacity: 0.55,
            transform: `rotateY(90deg) translateZ(${half}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color,
            opacity: 0.3,
            transform: `rotateX(90deg) translateZ(${half}px)`,
          }}
        />
      </motion.div>
    </div>
  )
}
