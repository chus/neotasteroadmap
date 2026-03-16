import Link from 'next/link'
import { CRITERION_CONFIG } from '@/lib/constants'
import ToolChangelog from '@/components/ToolChangelog'

const columns = [
  {
    name: 'Now',
    period: 'Q1\u2013Q2 \u00b7 Jan \u2192 Jun',
    desc: 'Active work. Fully scoped and in sprint or queued for next sprint.',
  },
  {
    name: 'Next',
    period: 'Q2\u2013Q3 \u00b7 Apr \u2192 Sep',
    desc: 'Committed and sequenced, not yet started. May have a dependency or design work in progress.',
  },
  {
    name: 'Later',
    period: 'Q3\u2013Q4 \u00b7 Jul \u2192 Dec',
    desc: 'Planned but not locked. Design or research may not be complete. Timing may shift.',
  },
  {
    name: 'Parked',
    period: 'Out of scope 2026',
    desc: 'Explicitly out of scope. Every parked item has a reason. Moving something here is a decision, not a default. Setting criterion to \u201cParked\u201d automatically moves the card here.',
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
    explanation: 'This initiative exists primarily to enable something else \u2014 a future experiment, another team, or a data decision.',
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
  {
    trigger: 'A key account requirement lands',
    result: 'Team dependency items get created and sequenced',
  },
]

const views = [
  {
    name: 'Board view',
    desc: 'The default. Initiatives as cards in four columns: Now, Next, Later, Parked. Drag to reorder or move between columns. Click any card to see full detail.',
  },
  {
    name: 'Swimlane view',
    desc: 'Same data, organised by strategic level (rows) \u00d7 column (columns). Shows at a glance whether effort is balanced across Discovery, Churn, Trial conversion, and Partner work.',
  },
  {
    name: 'List view',
    desc: 'Sortable, filterable table of all initiatives. Exportable to CSV. Best for planning meetings and bulk updates.',
  },
]

const publicViews = [
  {
    name: '/public',
    desc: 'A read-only board showing initiatives marked as public. No internal fields exposed.',
  },
  {
    name: '/releases',
    desc: 'A public changelog of everything shipped in 2026, grouped by month.',
  },
  {
    name: '/stakeholder',
    desc: 'A simplified view for commercial, ops, and leadership. Shows strategic level and column without product detail. Shareable link.',
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

      {/* Section 1 — What this tool is */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          What this is
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          This is NeoTaste&apos;s internal product planning tool. It combines a sequencing board, a feature request portal, and a public changelog in one place. It&apos;s built to make product decisions transparent &mdash; not just what we&apos;re building, but why things are sequenced the way they are, what&apos;s blocked, and what we&apos;ve shipped.
        </p>
      </section>

      {/* Section 2 — Three views */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-4">
          Three ways to see the roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {views.map((v) => (
            <div key={v.name} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-[13px] font-semibold text-neutral-800 mb-1">{v.name}</div>
              <p className="text-[12px] text-neutral-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Four columns */}
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

      {/* Section 4 — Five criteria */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-2">
          Why things are sequenced the way they are
        </h2>
        <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
          Every initiative has one primary reason for its timing. This is not a priority score &mdash; it&apos;s the dominant constraint or enabler that determined when it ships.
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

      {/* Section 5 — Strategic bets */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Strategic bets
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          Some initiatives span the entire year and have too much uncertainty to live as a single card. These appear as banners above the board. Each bet has a current phase (Discovery / Definition / Build / Launch / Done) and links to child initiatives on the main board. Example: Card-linked offers.
        </p>
      </section>

      {/* Section 6 — Key account dependencies */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Key account dependencies
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          When a business commitment (a partner, a franchise rollout, a regulatory requirement) creates pull on product capacity, it appears as a strip above the board. These are constraints, not initiatives &mdash; they explain why certain cards exist and why capacity may be limited in certain quarters. Example: Steinecke franchise rollout.
        </p>
      </section>

      {/* Section 7 — Initiative detail */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          What&apos;s on each card
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          Clicking any card opens a detail panel. It shows: description, sequencing rationale (derived from criterion), dependency note, linked feature request, Linear sync status, effort estimate, target month, confidence scores (if set), decision log, and reaction bar. Edit from the panel &mdash; changes reflect on the board immediately without a page reload.
        </p>
      </section>

      {/* Section 8 — Linear integration */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Linear sync
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          Initiatives can be linked to Linear projects. Once linked, you can push roadmap data to Linear or pull Linear state back into the roadmap. A daily drift check (runs at midnight) compares both sides and flags differences as an amber indicator on the card. Drift is never auto-resolved &mdash; you always confirm which side wins.
        </p>
      </section>

      {/* Section 9 — Feature requests */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Suggesting a feature
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          The feature request portal at{' '}
          <Link href="/requests" className="text-[#5E6AD2] hover:underline">/requests</Link>
          {' '}is open to anyone with the link. Submissions follow a Working Backwards format &mdash; you need to articulate the customer problem, current behaviour, desired outcome, success metric, and evidence before submitting. Vague submissions are flagged by AI triage. Requests can be voted on anonymously. The product team can promote a request directly to the roadmap board.
        </p>
      </section>

      {/* Section 10 — Public views */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-4">
          What&apos;s public
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {publicViews.map((v) => (
            <div key={v.name} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-[13px] font-semibold text-neutral-800 mb-1">
                <Link href={v.name} className="text-[#5E6AD2] hover:underline">{v.name}</Link>
              </div>
              <p className="text-[12px] text-neutral-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 11 — Stats */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-3">
          Stats and signals
        </h2>
        <p className="text-[13px] text-neutral-600 leading-relaxed">
          The{' '}
          <Link href="/stats" className="text-[#5E6AD2] hover:underline">/stats</Link>
          {' '}page shows initiative distribution by column, strategic level, criterion, effort, and target month. It includes a confidence matrix (problem confidence &times; solution confidence), a capacity planning view based on effort estimates and team size, and target month mismatch detection. Insights are auto-generated from the data &mdash; no AI needed.
        </p>
      </section>

      {/* Section 12 — What moves things */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-4">
          What moves things
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {movers.map((m) => (
            <div key={m.trigger} className="border border-neutral-200 rounded-lg p-4">
              <div className="text-[12px] font-medium text-neutral-800 mb-1">
                {m.trigger}
              </div>
              <p className="text-[12px] text-neutral-500">&rarr; {m.result}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-4">
          Urgency from a stakeholder is not a sequencing criterion. If you believe something should move, use the feature request portal to make the case &mdash; with customer evidence.
        </p>
      </section>

      {/* Section 13 — Feature requests CTA */}
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

      {/* Divider */}
      <hr className="my-12 border-neutral-200" />

      {/* Tool changelog */}
      <section className="mb-12">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">
          Tool changelog
        </h2>
        <p className="text-[13px] text-neutral-500 mb-6">
          A record of features added to this tool since launch.
        </p>
        <ToolChangelog />
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
