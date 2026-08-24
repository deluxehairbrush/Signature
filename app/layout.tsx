import { Fraunces, Inter } from 'next/font/google'
import type { Metadata } from 'next'
import CursorDot from './components/CursorDot'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Signature — freelance deals you can prove',
  description:
    'Signature connects freelancers and clients with public profiles, AI-assisted contract summaries, and a track record you can verify before you hire.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">
        <CursorDot />
        {children}
      </body>
    </html>
  )
}
