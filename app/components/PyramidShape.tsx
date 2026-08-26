'use client'

import { motion } from 'framer-motion'

type PyramidShapeProps = {
  size?: number
  color?: string
  className?: string
  duration?: number
  delay?: number
}

/**
 * A four-sided CSS pyramid — same preserve-3d technique as FloatingShape's
 * cube, but built from triangular faces (border-trick) instead of squares,
 * so the hero's decorative geometry isn't just repeated cubes.
 */
export default function PyramidShape({
  size = 120,
  color = '#7C3AED',
  className = '',
  duration = 15,
  delay = 0,
}: PyramidShapeProps) {
  const half = size / 2
  const faceHeight = size * 0.92

  const face = (rotateY: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        width: 0,
        height: 0,
        borderLeft: `${half}px solid transparent`,
        borderRight: `${half}px solid transparent`,
        borderBottom: `${faceHeight}px solid ${color}`,
        opacity,
        transformOrigin: 'top',
        transform: `translateX(-50%) rotateY(${rotateY}deg) rotateX(-14deg) translateZ(${half * 0.42}px)`,
      }}
    />
  )

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: faceHeight, perspective: 800 }}
    >
      <motion.div
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
        animate={{ rotateY: [0, 360] }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
      >
        {face(0, 1)}
        {face(90, 0.7)}
        {face(180, 0.45)}
        {face(270, 0.7)}
      </motion.div>
    </div>
  )
}
