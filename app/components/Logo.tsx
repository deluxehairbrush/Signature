import Image from 'next/image'

export default function Logo({
  className = '',
  invert = true,
}: {
  className?: string
  invert?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl italic ${className}`}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={166}
        height={107}
        priority
        className="h-5 w-auto"
        style={invert ? { filter: 'invert(1) brightness(2)' } : undefined}
      />
      <span className="hidden sm:inline">Signature</span>
    </span>
  )
}
