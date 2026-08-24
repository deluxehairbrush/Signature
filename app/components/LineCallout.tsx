type LineCalloutProps = {
  caption: string
  className?: string
  tone?: 'light' | 'dark'
}

/**
 * Bottom-left italic caption with a thin diagonal line running out to a dot,
 * matching the annotation-line device used throughout the reference design
 * to connect a caption to the visual above it.
 */
export default function LineCallout({ caption, className = '', tone = 'light' }: LineCalloutProps) {
  const lineColor = tone === 'light' ? 'text-paper/40' : 'text-ink/40'
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-32 md:bottom-28 ${className}`}>
      <p
        className={`font-display text-base italic leading-snug ${
          tone === 'light' ? 'text-paper/80' : 'text-ink/80'
        } max-w-[16rem] px-6 md:px-10`}
      >
        {caption}
      </p>
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className={`mt-2 h-6 w-[70%] ${lineColor}`}
        aria-hidden="true"
      >
        <polyline points="0,2 100,10" className="accent-line" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="10" r="1.4" fill="currentColor" />
      </svg>
    </div>
  )
}
