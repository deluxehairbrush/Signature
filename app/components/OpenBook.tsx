'use client'

import { motion } from 'framer-motion'

export default function OpenBook({
  size = 140,
  coverColor = '#F6F4EC',
  pageColor = '#86C22A',
  className = '',
}: {
  size?: number
  coverColor?: string
  pageColor?: string
  className?: string
}) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: size, height: size * 0.7, perspective: 900 }}>
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: [-6, 6, -6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: '50%',
            height: '100%',
            background: coverColor,
            transformOrigin: 'left center',
            transform: 'rotateY(-28deg)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            borderRadius: '0 6px 6px 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: '50%',
            height: '100%',
            background: coverColor,
            transformOrigin: 'left center',
            transform: 'rotateY(-28deg) translateZ(0.5px)',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '50%',
            top: 0,
            width: '50%',
            height: '100%',
            background: pageColor,
            transformOrigin: 'right center',
            transform: 'rotateY(28deg)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            borderRadius: '6px 0 0 6px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '4%',
            width: 2,
            height: '92%',
            background: 'rgba(0,0,0,0.15)',
            transform: 'translateX(-50%)',
          }}
        />
      </motion.div>
    </div>
  )
}
