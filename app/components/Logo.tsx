export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl italic ${className}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M2 14 L10 2 L18 14 L10 18 Z" fill="currentColor" />
      </svg>
      Signature
    </span>
  )
}
