import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

type Tone = 'dark' | 'light'

const toneClass: Record<Tone, string> = {
  dark: 'border-paper/15 bg-paper/5 text-paper placeholder:text-paper/30 focus:border-accent',
  light: 'border-ink/15 bg-white/60 text-ink placeholder:text-ink/30 focus:border-signal',
}

const labelToneClass: Record<Tone, string> = {
  dark: 'text-paper/50',
  light: 'text-muted',
}

export default function FormField({
  label,
  tone = 'dark',
  ...props
}: { label: string; tone?: Tone } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs uppercase tracking-widest ${labelToneClass[tone]}`}>{label}</span>
      <input
        {...props}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${toneClass[tone]}`}
      />
    </label>
  )
}

export function FormTextarea({
  label,
  tone = 'dark',
  ...props
}: { label: string; tone?: Tone } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs uppercase tracking-widest ${labelToneClass[tone]}`}>{label}</span>
      <textarea
        {...props}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${toneClass[tone]}`}
      />
    </label>
  )
}

export function FormSelect({
  label,
  tone = 'dark',
  children,
  className = '',
  ...props
}: { label: string; tone?: Tone; className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`block ${className}`}>
      <span className={`mb-1.5 block text-xs uppercase tracking-widest ${labelToneClass[tone]}`}>{label}</span>
      <select
        {...props}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${toneClass[tone]}`}
      >
        {children}
      </select>
    </label>
  )
}
