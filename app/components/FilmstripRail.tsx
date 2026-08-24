'use client'

import { useState } from 'react'
import { chapters, bgClass } from './chapters'

export default function FilmstripRail({
  active,
  onJump,
}: {
  active: number
  onJump: (index: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="absolute right-0 top-0 z-10 hidden h-full w-14 flex-col gap-2 py-2 md:flex">
      {chapters.map((c, i) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onJump(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          aria-label={`Jump to ${c.title}`}
          className={`relative flex-1 rounded-l-md transition-all duration-300 ${bgClass[c.bg]} ${
            i === active ? 'opacity-100 w-full' : 'opacity-30 w-2/3 hover:opacity-70'
          }`}
          style={{ marginLeft: 'auto' }}
        >
          {hovered === i && (
            <span className="absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs text-paper shadow-lg">
              {c.index} — {c.title}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
