'use client'

import { chapters } from './chapters'

export default function StepRuler({ active }: { active: number }) {
  return (
    <div className="pointer-events-none absolute left-3 top-0 z-10 hidden h-full flex-col items-center justify-center gap-4 md:flex">
      <div className="absolute h-2/3 w-px bg-paper/15" />
      {chapters.map((c, i) => (
        <div key={c.key} className="relative flex items-center gap-2">
          <span
            className="h-px w-3 transition-colors duration-300"
            style={{ background: i === active ? '#C7F464' : 'rgba(246,244,236,0.35)' }}
          />
          <span
            className="font-display text-[11px] italic tracking-widest transition-colors duration-300"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: i === active ? '#C7F464' : 'rgba(246,244,236,0.35)',
            }}
          >
            {c.index} {c.title}
          </span>
        </div>
      ))}
    </div>
  )
}
