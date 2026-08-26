'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import AccountNav from './AccountNav'
import Logo from './Logo'
import PillLink from './PillLink'
import TiltCard from './TiltCard'
import FloatingShape from './FloatingShape'
import OpenBook from './OpenBook'
import LineCallout from './LineCallout'
import OrbitDiagram from './OrbitDiagram'
import StepRuler from './StepRuler'
import FilmstripRail from './FilmstripRail'
import BottomPill from './BottomPill'
import ChapterMenu from './ChapterMenu'
import GrainOverlay from './GrainOverlay'
import KineticHeadline from './KineticHeadline'
import ParallaxLayer from './ParallaxLayer'
import { chapters, bgClass } from './chapters'
import { placeholderProfiles } from './placeholder-data'

const freelancerFeatures = [
  'Showcase the projects you are proud of',
  'List the areas you work in and your rate',
  'Mark yourself open to work, or not',
  'One-tap contact — WhatsApp, email, whatever you set',
]

const clientFeatures = [
  'Say what you are hiring for and your budget',
  'Set deadline preferences up front',
  "See a freelancer's track record before you reach out",
  'No account needed just to browse',
]


const PANEL_COUNT = chapters.length

function Panel({
  index,
  progress,
  bg,
  className = '',
  children,
}: {
  index: number
  progress: MotionValue<number>
  bg: (typeof chapters)[number]['bg']
  className?: string
  children: React.ReactNode
}) {
  const center = index / (PANEL_COUNT - 1)
  const step = 1 / (PANEL_COUNT - 1)
  const rotateY = useTransform(progress, [center - step, center, center + step], [16, 0, -16])
  const opacity = useTransform(
    progress,
    [center - step, center - step * 0.5, center, center + step * 0.5, center + step],
    [0.3, 1, 1, 1, 0.3],
  )
  const scale = useTransform(progress, [center - step, center, center + step], [0.9, 1, 0.9])

  return (
    <motion.div
      style={{ rotateY, opacity, scale, transformStyle: 'preserve-3d' }}
      className={`relative flex h-full w-screen shrink-0 items-center pb-20 pt-16 ${bgClass[bg]} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function LandingExperience() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(PANEL_COUNT - 1, Math.max(0, Math.round(v * (PANEL_COUNT - 1)))))
  })

  const x = useTransform(scrollYProgress, [0, 1], ['0vw', `-${(PANEL_COUNT - 1) * 100}vw`])

  function jumpTo(index: number) {
    const track = trackRef.current
    if (!track) return
    const target = track.offsetTop + index * window.innerHeight
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const isLight = chapters[active].bg === 'paper' || chapters[active].bg === 'accent'

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-10">
        <Logo className={isLight ? 'text-ink' : 'text-paper'} invert={!isLight} />
        <div className="flex items-center gap-3">
          <AccountNav variant={isLight ? 'light' : 'dark'}>
            <PillLink
              href="/login"
              variant="light"
              className={`!hidden !bg-transparent hover:!opacity-70 md:!inline-flex ${
                isLight ? '!border-ink/20 !text-ink' : '!border-paper/20 !text-paper'
              }`}
            >
              Sign in
            </PillLink>
            <PillLink href="/signup" variant="dark" className={isLight ? '' : '!bg-accent !text-ink'}>
              Get started
            </PillLink>
          </AccountNav>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open chapter menu"
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
              isLight
                ? 'border-ink/25 text-ink hover:border-ink/60'
                : 'border-paper/25 text-paper hover:border-paper/60'
            }`}
          >
            <span className="flex flex-col gap-1">
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </header>

      <ChapterMenu open={menuOpen} onClose={() => setMenuOpen(false)} active={active} onJump={jumpTo} />
      <GrainOverlay />

      {/* Horizontal chapter track — vertical scroll drives horizontal motion */}
      <section ref={trackRef} style={{ height: `${PANEL_COUNT * 100}vh` }} className="relative">
        <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: 1800 }}>
          <StepRuler active={active} />
          <FilmstripRail active={active} onJump={jumpTo} />

          <motion.div style={{ x }} className="flex h-full">
            {/* Chapter 00 — Hero */}
            <Panel index={0} progress={scrollYProgress} bg="ink" className="justify-center">
              <ParallaxLayer strength={32} className="absolute right-[14%] top-[18%] hidden lg:block">
                <FloatingShape size={140} duration={16} />
              </ParallaxLayer>
              <ParallaxLayer strength={18} className="absolute left-[10%] bottom-[24%] hidden lg:block">
                <FloatingShape size={70} color="#F6F4EC" duration={11} delay={1.2} />
              </ParallaxLayer>
              <ParallaxLayer strength={44} className="absolute right-[6%] bottom-[16%] hidden lg:block">
                <OpenBook size={130} />
              </ParallaxLayer>
              <div className="mx-auto max-w-3xl px-6 md:px-16">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="mb-6 font-display text-sm italic text-accent"
                >
                  For freelancers and the people who hire them
                </motion.p>
                <KineticHeadline
                  className="font-display text-6xl italic leading-[1.05] md:text-8xl"
                  lines={['Work you can trust.', 'Deals you can prove.']}
                />
                <p className="mt-8 max-w-xl text-lg text-paper/70">
                  Signature is a public home for freelance work: a profile that
                  speaks for itself, and a track record that isn&apos;t just a claim.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <PillLink href="/signup?as=freelancer" variant="accent">
                    I&apos;m a freelancer
                  </PillLink>
                  <PillLink
                    href="/signup?as=client"
                    variant="light"
                    className="!border-paper/30 !bg-transparent !text-paper hover:!border-paper"
                  >
                    I&apos;m hiring
                  </PillLink>
                </div>
              </div>
            </Panel>

            {/* Chapter 01 — What this is */}
            <Panel index={1} progress={scrollYProgress} bg="paper" className="max-h-full justify-center overflow-y-auto py-24 md:overflow-visible md:py-0">
              <div className="mx-auto max-w-4xl px-6 md:px-16">
                <p className="text-xs uppercase tracking-widest text-muted">The idea</p>
                <h2 className="mt-3 font-display text-2xl italic leading-snug md:mt-4 md:text-5xl">
                  Freelance trust shouldn&apos;t live in screenshots and DM threads.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 md:mt-6 md:text-lg">
                  Most freelance work still runs on scattered chats, invoices
                  nobody double-checks, and reputations nobody can verify.
                  Signature gives every freelancer and client a public page —
                  plus a record of what they actually delivered — that works
                  as both a pitch and a receipt.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-signal">What it is</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-ink/80 md:mt-3 md:space-y-2 md:text-sm">
                      <li>A public profile, viewable without an account</li>
                      <li>A history built from completed deals, not self-reported stars</li>
                      <li>One place to point to instead of a folder of screenshots</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted">What it isn&apos;t</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-ink/60 md:mt-3 md:space-y-2 md:text-sm">
                      <li>Not a marketplace that bids your rate down</li>
                      <li>Not a rating anyone can leave without a real deal behind it</li>
                      <li>Not a wall of testimonials you have to take on faith</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Chapter 02 — Create a profile */}
            <Panel index={2} progress={scrollYProgress} bg="signal" className="justify-center">
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:px-16">
                <div>
                  <span className="font-display text-8xl italic text-paper/20">02</span>
                  <h3 className="mt-4 font-display text-4xl italic">Create a profile</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-paper/70">
                    Freelancers list their work, rates, and availability. Clients
                    list what they need and their budget. Both take two minutes.
                  </p>
                </div>
                <TiltCard className="hidden aspect-square md:block">
                  <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-paper/15 bg-paper/10 p-8 backdrop-blur">
                    <div className="h-14 w-14 rounded-full bg-accent" />
                    <div className="space-y-3">
                      <div className="h-3 w-3/4 rounded-full bg-paper/30" />
                      <div className="h-3 w-1/2 rounded-full bg-paper/20" />
                      <div className="h-3 w-2/3 rounded-full bg-paper/20" />
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-pill bg-accent px-4 py-1.5 text-xs text-ink">Open to work</span>
                      <span className="rounded-pill border border-paper/25 px-4 py-1.5 text-xs">Design</span>
                    </div>
                  </div>
                </TiltCard>
              </div>
              <LineCallout
                caption="One profile. Everything a client needs to decide."
                tone="light"
              />
            </Panel>

            {/* Chapter 03 — Get found, or go looking */}
            <Panel index={3} progress={scrollYProgress} bg="accent" className="justify-center">
              <div className="mx-auto w-full max-w-5xl px-6 md:px-16">
                <span className="font-display text-8xl italic text-ink/20">03</span>
                <h3 className="mt-4 font-display text-4xl italic text-ink">Get found, or go looking</h3>
                <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
                  {[
                    ['0', 'Login required to browse'],
                    ['100%', 'Public profile visibility'],
                    ['1', 'Click to say hello'],
                    ['24/7', 'Directory always open'],
                  ].map(([stat, label]) => (
                    <div key={label}>
                      <p className="font-display text-5xl italic text-ink">{stat}</p>
                      <p className="mt-2 text-sm text-ink/60">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ParallaxLayer strength={26} className="absolute right-[10%] top-[20%] hidden lg:block">
                <FloatingShape size={130} color="#12120D" duration={15} />
              </ParallaxLayer>
              <LineCallout
                caption="Anyone can look. Only hiring needs an account."
                tone="dark"
              />
            </Panel>

            {/* Chapter 04 — Build a record */}
            <Panel index={4} progress={scrollYProgress} bg="ink" className="justify-center">
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2 md:px-16">
                <div>
                  <span className="font-display text-8xl italic text-paper/15">04</span>
                  <h3 className="mt-4 font-display text-4xl italic">Build a record</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-paper/60">
                    Every completed deal adds to a verifiable history: on-time
                    payments, fair compensation, both sides confirming the work
                    was done.
                  </p>
                </div>
                <OrbitDiagram className="mx-auto h-72 w-72 text-paper/70 md:h-96 md:w-96" />
              </div>
              <LineCallout caption="Not a star rating. An actual timeline." tone="light" />
            </Panel>

            {/* Chapter 05 — freelancer / client split */}
            <Panel index={5} progress={scrollYProgress} bg="paper" className="max-h-full justify-center overflow-y-auto py-24 md:overflow-visible md:py-0">
              <FloatingShape size={90} color="#7C3AED" className="absolute left-[6%] top-[12%] hidden lg:block" duration={13} />
              <OpenBook size={110} coverColor="#12120D" pageColor="#F6F4EC" className="absolute right-[6%] bottom-[10%] hidden lg:block" />
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 md:grid-cols-2 md:gap-8 md:px-16">
                <TiltCard>
                  <div className="h-full rounded-2xl border border-ink/10 bg-white/50 p-5 md:rounded-3xl md:p-10">
                    <p className="text-xs uppercase tracking-widest text-muted">For freelancers</p>
                    <h3 className="mt-2 font-display text-xl italic text-ink md:mt-3 md:text-3xl">Your work, out front</h3>
                    <ul className="mt-3 space-y-2 md:mt-8 md:space-y-4">
                      {freelancerFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-ink/80 md:gap-3 md:text-sm">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal md:mt-1.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
                <TiltCard>
                  <div className="h-full rounded-2xl border border-ink/10 bg-ink p-5 text-paper md:rounded-3xl md:p-10">
                    <p className="text-xs uppercase tracking-widest text-paper/50">For clients</p>
                    <h3 className="mt-2 font-display text-xl italic md:mt-3 md:text-3xl">Hire with evidence</h3>
                    <ul className="mt-3 space-y-2 md:mt-8 md:space-y-4">
                      {clientFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-paper/80 md:gap-3 md:text-sm">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent md:mt-1.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </div>
            </Panel>

            {/* Chapter 06 — browse preview */}
            <Panel index={6} progress={scrollYProgress} bg="signal" className="max-h-full justify-center overflow-y-auto py-24 md:overflow-visible md:py-0">
              <div className="mx-auto w-full max-w-5xl px-6 md:px-16">
                <h2 className="font-display text-2xl italic md:text-4xl">
                  Look someone up — no account needed
                </h2>
                <div className="mt-6 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
                  {placeholderProfiles.map((p) => (
                    <TiltCard key={p.name} className="md:aspect-[4/5]">
                      <Link
                        href="/browse"
                        className="flex h-full flex-row items-center gap-4 rounded-2xl border border-paper/15 bg-paper/10 p-4 backdrop-blur md:flex-col md:items-stretch md:justify-between md:p-6"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-full bg-accent" />
                        <div>
                          <p className="font-display text-lg italic">{p.name}</p>
                          <p className="text-sm text-paper/60">{p.role}</p>
                          <div className="mt-1 flex items-center gap-4 text-xs text-paper/50 md:mt-4 md:justify-between">
                            <span>{p.rate}</span>
                            <span>{p.deals} deals</span>
                          </div>
                        </div>
                      </Link>
                    </TiltCard>
                  ))}
                </div>
                <p className="mt-6 text-xs text-paper/40">
                  Placeholder profiles — live data connects once the public
                  directory (backend/apps/search) is wired up.
                </p>
              </div>
            </Panel>

            {/* Chapter 07 — closing CTA */}
            <Panel index={7} progress={scrollYProgress} bg="accent" className="justify-center">
              <ParallaxLayer strength={30} className="absolute left-[10%] top-[16%] hidden lg:block">
                <FloatingShape size={110} color="#12120D" duration={14} />
              </ParallaxLayer>
              <ParallaxLayer strength={20} className="absolute right-[12%] bottom-[20%] hidden lg:block">
                <FloatingShape size={70} color="#7C3AED" duration={10} delay={0.6} />
              </ParallaxLayer>
              <div className="mx-auto max-w-2xl px-6 text-center text-ink">
                <h2 className="font-display text-5xl italic md:text-6xl">
                  Ready to sign your name to it?
                </h2>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <PillLink href="/signup?as=freelancer" variant="dark">
                    Create a freelancer profile
                  </PillLink>
                  <PillLink
                    href="/signup?as=client"
                    variant="light"
                    className="!border-ink/30 !bg-transparent !text-ink hover:!border-ink"
                  >
                    Create a client profile
                  </PillLink>
                </div>
              </div>
            </Panel>
          </motion.div>

          <BottomPill active={active} />
        </div>
      </section>
    </>
  )
}
