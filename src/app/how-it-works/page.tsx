import Link from 'next/link'
import { CRITERION_CONFIG } from '@/lib/constants'

const columns = [
  {
    name: 'Now',
    period: 'Q1–Q2',
    desc: 'Active work. Either in sprint or queued for the next one. Items here are fully scoped.',
  },
  {
    name: 'Next',
    period: 'Q2–Q3',
    desc: 'Sequenced and committed, but not yet started. May have a dependency or design work in progress.',
  },
  {
    name: 'Later',
    period: 'Q3–Q4',
    desc: 'Planned but not locked. Timing may shift. Design or research may not be complete.',
  },
  {
    name: 'Parked',
    period: 'Out of scope',
    desc: 'Out of scope for 2026. Each item has an explicit reason. Moving something here is a decision, not a default.',
  },
]

const criteria = [
  {
    key: 'execution_ready' as const,
    explanation: 'Spec and design are complete. The main reason it\'s in Now or Next is that we can actually build it.',
    example: 'Restaurant details page, Map pins',
  },
  {
    key: 'foundation' as const,
    explanation: 'This initiative exists primarily to enable something else — a future experiment, another team, or a data decision.',
    example: 'Attribution survey, Frontend redirect button',
  },
  {
    key: 'dependency' as const,
    explanation: 'Another team or external partner is blocked or waiting. We\'re sequencing this to unblock them, not because it\'s our top user priority.',
    example: 'Vouchers on plan level, Partner referral page',
  },
  {
    key: 'research' as const,
    explanation: 'We don\'t yet have the data, infrastructure, or validated approach to build this well. It needs a spike or upstream work first.',
    example: 'Pricing test phase 1 & 2, Value guarantee',
  },
  {
    key: 'parked' as const,
    explanation: 'Out of scope. Reasons vary: effort too high relative to near-term impact, no owner, strategic timing not right, or dependency on a decision not yet made.',
    example: 'Lists, Referral QR codes',
  },
]

const movers = [
  {
    trigger: 'A spec or design completes',
    result: 'Execution ready items can move to Now',
  },
  {
    trigger: 'A spike or infra work lands',
    result: 'Research needed items get unblocked',
  },
  {
    trigger: 'An owner is assigned or strategy shifts',
    result: 'Parked items can re-enter the board',
  },
]

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-semibold text-neutral-800 mb-2">
          How this roadmap works
        </h1>
        <p className="text-[14px] text-neutral-500 max-w-xl">
          A reference for anyone reading or contributing to the NeoTaste 2026 product roadmap.
        </p>
      </div>

      {/* Section 1 — Two views */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Two views, one source of truth
        </h2>
        <div className="space-y-3 text-[13px] text-neutral-600 leading-relaxed">
          <p>The roadmap has two layers:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-neutral-800">The sequencing map (this board)</strong> — answers &quot;why this order.&quot; Shows the strategic logic: what&apos;s ready, what&apos;s blocked, what&apos;s parked and why.
            </li>
            <li>
              <strong className="text-neutral-800">The timeline (Gantt, managed separately)</strong> — answers &quot;when exactly.&quot; Shows sprint-level execution detail.
            </li>
          </ul>
          <p>
            The board is the primary artefact for planning conversations and deprioritisation discussions. The Gantt is for the team&apos;s day-to-day execution.
          </p>
        </div>
      </section>

      {/* Section 2 — Four columns */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-4">
          What the columns mean
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {columns.map((col) => (
            <div key={col.name} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-[13px] font-semibold text-neutral-800">{col.name}</div>
              <div className="text-[11px] text-neutral-400 mb-2">{col.period}</div>
              <p className="text-[12px] text-neutral-600 leading-relaxed">{col.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Five criteria */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-2">
          Why things are sequenced the way they are
        </h2>
        <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
          Every initiative has one primary reason for its timing. This is not a priority score — it&apos;s the dominant constraint or enabler that determined when it ships.
        </p>
        <div className="space-y-2">
          {criteria.map((c) => {
            const config = CRITERION_CONFIG[c.key]
            return (
              <div
                key={c.key}
                className="flex gap-4 border border-neutral-200 rounded-lg p-4 items-start"
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: config.border }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </div>
                  <p className="text-[12px] text-neutral-600 leading-relaxed mt-1">
                    {c.explanation}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1 italic">
                    e.g. {c.example}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 4 — What moves things */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-4">
          What changes prioritisation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {movers.map((m) => (
            <div key={m.trigger} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-[12px] font-medium text-neutral-800 mb-1">
                {m.trigger}
              </div>
              <p className="text-[12px] text-neutral-500">→ {m.result}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-4">
          Urgency from a stakeholder is not a sequencing criterion. If you believe something should move, use the feature request portal to make the case — with customer evidence.
        </p>
      </section>

      {/* Section 5 — Feature requests */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-2">
          Want to suggest something?
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">
          The feature request portal exists for exactly this. Submit a structured request with customer evidence and it will be reviewed by the product team.
        </p>
        <Link
          href="/requests"
          className="inline-block text-[13px] font-medium px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          Submit a feature request
        </Link>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-neutral-100">
        <p className="text-[11px] text-neutral-400">
          Questions about the roadmap? Reach out to the product team.
        </p>
      </footer>
    </main>
  )
}
