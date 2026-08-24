'use client'

import { motion } from 'framer-motion'

type OrbitDiagramProps = {
  points?: number
  centerLabel?: string
  centerSub?: string
  className?: string
}

/**
 * Concentric-orbit visualization: each completed deal plotted as a dot
 * spiralling outward, echoing the reference design's year-orbit diagram —
 * repurposed here to represent a growing, verifiable deal history.
 */
export default function OrbitDiagram({
  points = 16,
  centerLabel = '27',
  centerSub = 'deals on record',
  className = '',
}: OrbitDiagramProps) {
  const cx = 200
  const cy = 200
  const rings = [30, 60, 92, 126, 162, 200]

  const dots = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    const angle = t * Math.PI * 4.2 - Math.PI / 2
    const r = 24 + t * 178
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle) * 0.42
    return { x, y, i, last: i === points - 1 }
  })

  return (
    <div className={className}>
      <svg viewBox="0 0 400 400" className="h-full w-full">
        {rings.map((r) => (
          <ellipse
            key={r}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * 0.42}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        ))}
        {dots.map((d) => (
          <motion.circle
            key={d.i}
            cx={d.x}
            cy={d.y}
            r={d.last ? 5 : 2.6}
            fill={d.last ? '#C7F464' : 'currentColor'}
            fillOpacity={d.last ? 1 : 0.55}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: d.i * 0.04, duration: 0.4 }}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="font-display italic"
          style={{ fontSize: 40, fill: 'currentColor' }}
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          style={{ fontSize: 11, fill: 'currentColor', opacity: 0.6, letterSpacing: '0.08em' }}
        >
          {centerSub.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}
