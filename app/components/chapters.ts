export type ChapterBg = 'ink' | 'signal' | 'accent' | 'paper'

export type Chapter = {
  key: string
  index: string
  title: string
  range: string
  bg: ChapterBg
  pill: string
}

export const chapters: Chapter[] = [
  {
    key: 'hero',
    index: '00',
    title: 'Signature',
    range: 'Start here',
    bg: 'ink',
    pill: 'Scroll to begin →',
  },
  {
    key: 'about',
    index: '01',
    title: 'What this is',
    range: 'The idea',
    bg: 'paper',
    pill: 'A public record, not a rating app',
  },
  {
    key: 'profile',
    index: '02',
    title: 'Create a profile',
    range: 'Freelancers & clients',
    bg: 'signal',
    pill: 'Two minutes, that’s it',
  },
  {
    key: 'discover',
    index: '03',
    title: 'Get found, or go looking',
    range: 'Public by default',
    bg: 'accent',
    pill: 'No login needed to browse',
  },
  {
    key: 'record',
    index: '04',
    title: 'Build a record',
    range: 'Every deal counts',
    bg: 'ink',
    pill: 'History you can verify',
  },
  {
    key: 'split',
    index: '05',
    title: 'Built for both sides',
    range: 'Freelancers + clients',
    bg: 'paper',
    pill: 'Pick a side, or don’t',
  },
  {
    key: 'browse',
    index: '06',
    title: 'Browse profiles',
    range: 'Live directory',
    bg: 'signal',
    pill: 'See who’s already here',
  },
  {
    key: 'principles',
    index: '07',
    title: 'Why we built this',
    range: 'What we stand for',
    bg: 'ink',
    pill: 'No shortcuts on trust',
  },
  {
    key: 'cta',
    index: '08',
    title: 'Sign your name to it',
    range: 'Get started',
    bg: 'accent',
    pill: 'Ready when you are',
  },
]

export const bgClass: Record<ChapterBg, string> = {
  ink: 'bg-ink text-paper',
  signal: 'bg-signal text-paper',
  accent: 'bg-accent-soft text-ink',
  paper: 'bg-paper text-ink',
}
