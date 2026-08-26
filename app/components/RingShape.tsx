'use client'

import { motion } from 'framer-motion'

type RingShapeProps = {
  size?: number
  color?: string
  dotCount?: number
  className?: string
  duration?: number
  tilt?: number
}

/**
 * A tilted ring of orbiting dots — a third distinct 3D form alongside the
 * cube (FloatingShape) and pyramid (PyramidShape), read as a halo/orbit
 * rather than a solid.
 */
export default function RingShape({
  size = 160,
  color = '#C7F464',
  dotCount = 10,
  className = '',
  duration = 18,
  tilt = 58,
}: RingShapeProps) {
  const radius = size / 2
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (i / dotCount) * 360
    return { angle, i }
  })

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, perspective: 700 }}
    >
      <div style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg)` }}>
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotate: 360 }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        >
          {dots.map((d) => (
            <div
              key={d.i}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: size * 0.07,
                height: size * 0.07,
                background: color,
                opacity: 0.35 + (d.i / dotCount) * 0.65,
                transform: `rotate(${d.angle}deg) translateX(${radius}px)`,
              }}
            />
          ))}
        </motion.div>
        <div
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: size * 0.94,
            height: size * 0.94,
            marginLeft: -(size * 0.47),
            marginTop: -(size * 0.47),
            borderColor: color,
            opacity: 0.18,
          }}
        />
      </div>
    </div>
  )
}
