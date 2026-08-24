import type { InputHTMLAttributes } from 'react'

export default function FormField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-paper/50">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-paper/15 bg-paper/5 px-4 py-3 text-sm text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-accent"
      />
    </label>
  )
}
