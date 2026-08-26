'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import { readSession } from '../../lib/api'

// Signed-in users land on /browse (the "/" landing page is a pitch for
// people who haven't signed up yet) — signed-out users still go home.
export default function LogoLink({
  className,
  invert,
}: {
  className?: string
  invert?: boolean
}) {
  const [href, setHref] = useState('/')

  useEffect(() => {
    if (readSession()) setHref('/browse')
  }, [])

  return (
    <Link href={href}>
      <Logo className={className} invert={invert} />
    </Link>
  )
}
