import Link from 'next/link'
import Logo from '../components/Logo'
import PillLink from '../components/PillLink'

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

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/">
          <Logo invert={false} />
        </Link>
        <PillLink href="/signup" variant="dark">
          Get started
        </PillLink>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <h1 className="font-display text-4xl italic md:text-5xl">How it works</h1>
        <div className="mt-12 space-y-12">
          {steps.map((step) => (
            <div key={step.n}>
              <span className="font-display text-6xl italic text-ink/15">{step.n}</span>
              <h2 className="mt-2 font-display text-2xl italic">{step.title}</h2>
              <p className="mt-2 max-w-lg text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
