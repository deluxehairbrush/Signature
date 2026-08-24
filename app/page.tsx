import Link from 'next/link'
import Logo from './components/Logo'
import PillLink from './components/PillLink'
import AnnotatedLine from './components/AnnotatedLine'
import Reveal from './components/Reveal'

const steps = [
  {
    n: '01',
    title: 'Create a profile',
    body: 'Freelancers list their work, rates, and availability. Clients list what they need and their budget. Both take two minutes.',
  },
  {
    n: '02',
    title: 'Get found, or go looking',
    body: 'Anyone can browse public freelancer profiles without an account. Hiring — or accepting work — is what needs a login.',
  },
  {
    n: '03',
    title: 'Build a record',
    body: 'Every completed deal adds to a verifiable history: on-time payments, fair compensation, both sides confirming the work was done.',
  },
]

const freelancerFeatures = [
  'Showcase the projects you’re proud of',
  'List the areas you work in and your rate',
  'Mark yourself open to work, or not',
  'One-tap contact — WhatsApp, email, whatever you set',
]

const clientFeatures = [
  'Say what you’re hiring for and your budget',
  'Set deadline preferences up front',
  'See a freelancer’s track record before you reach out',
  'No account needed just to browse',
]

const placeholderProfiles = [
  { name: 'Aanya Rao', role: 'Product designer', rate: '₹2,500/hr', deals: 14 },
  { name: 'Marcus Webb', role: 'Full-stack developer', rate: '$60/hr', deals: 27 },
  { name: 'Studio Lune', role: 'Brand & motion', rate: '€45/hr', deals: 9 },
]

export default function Home() {
  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
            <Link href="/browse" className="hover:text-ink">
              Browse freelancers
            </Link>
            <Link href="/how-it-works" className="hover:text-ink">
              How it works
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <PillLink href="/login" variant="light">
              Sign in
            </PillLink>
            <PillLink href="/signup" variant="accent">
              Get started
            </PillLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <p className="mb-6 font-display text-sm italic text-accent">
              For freelancers and the people who hire them
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="max-w-3xl font-display text-5xl italic leading-[1.05] md:text-7xl">
              Work you can trust.
              <br />
              Deals you can prove.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg text-paper/70">
              Signature is a public home for freelance work: a profile that
              speaks for itself, and a track record that isn&apos;t just a claim.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap gap-4">
              <PillLink href="/signup?as=freelancer" variant="accent">
                I&apos;m a freelancer
              </PillLink>
              <PillLink href="/signup?as=client" variant="light" className="!bg-transparent !text-paper !border-paper/30 hover:!border-paper">
                I&apos;m hiring
              </PillLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="font-display text-3xl italic md:text-4xl">How it works</h2>
        </Reveal>
        <div className="mt-16 grid gap-16 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div className="text-sm text-muted">{step.n}</div>
              <AnnotatedLine direction={i % 2 === 0 ? 'up' : 'down'} className="my-4" />
              <h3 className="font-display text-xl italic">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* For freelancers / For clients */}
      <section className="bg-paper-dim">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-2">
          <div className="bg-paper-dim p-10 md:p-14">
            <Reveal>
              <p className="text-xs uppercase tracking-widest text-muted">For freelancers</p>
              <h3 className="mt-3 font-display text-3xl italic">Your work, out front</h3>
              <ul className="mt-8 space-y-4">
                {freelancerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="bg-ink p-10 text-paper md:p-14">
            <Reveal delay={0.08}>
              <p className="text-xs uppercase tracking-widest text-paper/50">For clients</p>
              <h3 className="mt-3 font-display text-3xl italic">Hire with evidence</h3>
              <ul className="mt-8 space-y-4">
                {clientFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-paper/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Browse preview */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl italic md:text-4xl">
              Look someone up — no account needed
            </h2>
            <Link href="/browse" className="hidden text-sm font-medium text-ink/60 hover:text-ink md:block">
              Browse all →
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {placeholderProfiles.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <Link
                href="/browse"
                className="block rounded-2xl border border-ink/10 bg-white/40 p-6 transition-colors hover:border-ink/30"
              >
                <div className="h-10 w-10 rounded-full bg-accent" />
                <p className="mt-4 font-display text-lg italic">{p.name}</p>
                <p className="text-sm text-muted">{p.role}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                  <span>{p.rate}</span>
                  <span>{p.deals} deals completed</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          Placeholder profiles shown above — live data connects once the
          public directory (backend/apps/search) is wired up.
        </p>
      </section>

      {/* CTA / footer */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="font-display text-4xl italic md:text-5xl">
              Ready to sign your name to it?
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PillLink href="/signup?as=freelancer" variant="accent">
                Create a freelancer profile
              </PillLink>
              <PillLink href="/signup?as=client" variant="light" className="!bg-transparent !text-paper !border-paper/30 hover:!border-paper">
                Create a client profile
              </PillLink>
            </div>
          </Reveal>
        </div>
        <div className="border-t border-paper/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-paper/50">
            <span>© {new Date().getFullYear()} Signature</span>
            <div className="flex gap-6">
              <Link href="/how-it-works" className="hover:text-paper">How it works</Link>
              <Link href="/browse" className="hover:text-paper">Browse</Link>
              <Link href="/login" className="hover:text-paper">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
