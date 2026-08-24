'use client'

import { chapters, bgClass } from './chapters'

export default function FilmstripRail({ active }: { active: number }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-14 flex-col gap-2 py-2 md:flex">
      {chapters.map((c, i) => (
        <div
          key={c.key}
          className={`flex-1 rounded-l-md transition-all duration-300 ${bgClass[c.bg]} ${
            i === active ? 'opacity-100 w-full' : 'opacity-30 w-2/3'
          }`}
          style={{ marginLeft: 'auto' }}
        />
      ))}
    </div>
  )
}
