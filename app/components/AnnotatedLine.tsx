type AnnotatedLineProps = {
  direction?: 'up' | 'down'
  className?: string
}

/**
 * A thin diagonal line with a dot at one end, echoing the hand-drawn
 * annotation lines used throughout the reference design to connect a
 * caption to the visual it describes.
 */
export default function AnnotatedLine({
  direction = 'up',
  className = '',
}: AnnotatedLineProps) {
  const points = direction === 'up' ? '0,32 100,4' : '0,4 100,32'
  const dotCx = direction === 'up' ? 100 : 100
  const dotCy = direction === 'up' ? 4 : 32

  return (
    <svg
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      className={`h-9 w-full text-ink/40 ${className}`}
      aria-hidden="true"
    >
      <polyline points={points} className="accent-line" vectorEffect="non-scaling-stroke" />
      <circle cx={dotCx} cy={dotCy} r="1.6" fill="currentColor" />
    </svg>
  )
}
