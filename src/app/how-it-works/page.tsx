import Link from 'next/link'
import type { Metadata } from 'next'
import { CRITERION_CONFIG } from '@/lib/constants'
import DocsSidebar from '@/components/docs/DocsSidebar'
import ToolChangelog from '@/components/ToolChangelog'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Documentation · NeoTaste Product Roadmap',
  description: 'How the NeoTaste product roadmap and Voice feedback system work.',
}

/* ── Reusable components ── */

function SectionDivider() {
  return <hr className="my-10 border-neutral-200" />
}

function Callout({ label, borderColor, children }: { label: string; borderColor: string; children: React.ReactNode }) {
  const bg = borderColor === '#EF9F27' ? '#FFF8E1' : '#E1F5EE'
  const labelColor = borderColor === '#EF9F27' ? '#633806' : '#085041'
  return (
    <div style={{ background: bg, borderLeft: `4px solid ${borderColor}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', margin: '20px 0' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: labelColor, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#2C2C2A', lineHeight: 1.7 }}>{children}</p>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '16px 0' }}>
      <thead>
        <tr style={{ background: 'var(--nt-dark, #0D2818)' }}>
          {headers.map((h, i) => (
            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#FFFFFF', fontWeight: 500, width: i === 0 ? '30%' : undefined }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#FAFAF9' : '#FFFFFF' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '8px 12px', fontWeight: j === 0 ? 500 : 400, color: j === 0 ? '#1a1a1a' : '#555', borderBottom: '0.5px solid #e5e5e5', verticalAlign: 'top' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Data ── */

const columns = [
  { name: 'Now', period: 'Q1\u2013Q2 \u00b7 Jan \u2192 Jun', desc: 'Active work. Fully scoped and in sprint or queued for next sprint.' },
  { name: 'Next', period: 'Q2\u2013Q3 \u00b7 Apr \u2192 Sep', desc: 'Committed and sequenced, not yet started. May have a dependency or design work in progress.' },
  { name: 'Later', period: 'Q3\u2013Q4 \u00b7 Jul \u2192 Dec', desc: 'Planned but not locked. Design or research may not be complete. Timing may shift.' },
  { name: 'Parked', period: 'Out of scope 2026', desc: 'Explicitly out of scope. Every parked item has a reason. Moving something here is a decision, not a default. Setting criterion to \u201cParked\u201d automatically moves the card here.' },
]

const criteria = [
  { key: 'execution_ready' as const, explanation: 'Spec and design are complete. The main reason it\'s in Now or Next is that we can actually build it.', example: 'Restaurant details page, Map pins' },
  { key: 'foundation' as const, explanation: 'This initiative exists primarily to enable something else \u2014 a future experiment, another team, or a data decision.', example: 'Attribution survey, Frontend redirect button' },
  { key: 'dependency' as const, explanation: 'Another team or external partner is blocked or waiting. We\'re sequencing this to unblock them, not because it\'s our top user priority.', example: 'Vouchers on plan level, Partner referral page' },
  { key: 'research' as const, explanation: 'We don\'t yet have the data, infrastructure, or validated approach to build this well. It needs a spike or upstream work first.', example: 'Pricing test phase 1 & 2, Value guarantee' },
  { key: 'parked' as const, explanation: 'Out of scope. Reasons vary: effort too high relative to near-term impact, no owner, strategic timing not right, or dependency on a decision not yet made.', example: 'Lists, Referral QR codes' },
]

const movers = [
  { trigger: 'A spec or design completes', result: 'Execution ready items can move to Now' },
  { trigger: 'A spike or infra work lands', result: 'Research needed items get unblocked' },
  { trigger: 'An owner is assigned or strategy shifts', result: 'Parked items can re-enter the board' },
  { trigger: 'A key account requirement lands', result: 'Team dependency items get created and sequenced' },
]

const views = [
  { name: 'Board view', desc: 'The default. Initiatives as cards in four columns: Now, Next, Later, Parked. Drag to reorder or move between columns. Click any card to see full detail.' },
  { name: 'Swimlane view', desc: 'Same data, organised by strategic level (rows) \u00d7 column (columns). Shows at a glance whether effort is balanced across Discovery, Churn, Trial conversion, and Partner work.' },
  { name: 'List view', desc: 'Sortable, filterable table of all initiatives. Exportable to CSV. Best for planning meetings and bulk updates.' },
]

const publicViews = [
  { name: '/public', desc: 'A read-only board showing initiatives marked as public. No internal fields exposed.' },
  { name: '/releases', desc: 'A public changelog of everything shipped in 2026, grouped by month.' },
  { name: '/stakeholder', desc: 'A simplified view for commercial, ops, and leadership. Shows strategic level and column without product detail. Shareable link.' },
]

/* ── Styles ── */

const h1Style = { fontSize: 20, fontWeight: 600, color: '#0D2818', marginTop: 28, marginBottom: 12 } as const
const h2Style = { fontSize: 16, fontWeight: 500, color: '#0D2818', marginTop: 20, marginBottom: 8 } as const
const bodyStyle = { fontSize: 14, lineHeight: 1.8, color: '#555' } as const
const listStyle = { listStyle: 'none', padding: 0, margin: '12px 0 12px 20px' } as const
const liStyle = { fontSize: 14, lineHeight: 1.8, color: '#555', marginBottom: 6 } as const

/* ── Page ── */

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white" style={{ padding: '48px 24px' }}>
      <DocsSidebar>
        {/* Cover block */}
        <div style={{ background: '#0D2818', borderRadius: 12, padding: '32px 36px', marginBottom: 40 }}>
          <p style={{ fontSize: 12, color: '#50E88A', fontWeight: 500, marginBottom: 8 }}>
            NeoTaste &middot; Internal documentation
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#FFFFFF', marginBottom: 12, lineHeight: 1.2 }}>
            Product Roadmap &amp; Voice
          </h1>
          <p style={{ fontSize: 14, color: '#AAAAAA', marginBottom: 24, lineHeight: 1.6 }}>
            How the roadmap works, how Voice collects and processes user feedback, and what we expect from both.
          </p>
          <p style={{ fontSize: 12, color: '#666666' }}>March 2026 &middot; Product team</p>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* PART 1 — ROADMAP GUIDE                     */}
        {/* ═══════════════════════════════════════════ */}

        {/* The board */}
        <section>
          <h1 id="the-board" style={{ ...h1Style, fontSize: 26, borderBottom: '2px solid #e5e5e5', paddingBottom: 8 }}>
            The board
          </h1>
          <p style={bodyStyle}>
            This is NeoTaste&apos;s internal product planning tool. It combines a sequencing board, a feature request portal, a consumer feedback system, and a public changelog in one place. It&apos;s built to make product decisions transparent &mdash; not just what we&apos;re building, but why things are sequenced the way they are, what&apos;s blocked, and what we&apos;ve shipped.
          </p>
        </section>

        <SectionDivider />

        {/* Columns */}
        <section>
          <h1 id="columns" style={h1Style}>What the columns mean</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {columns.map((col) => (
              <div key={col.name} className="border border-neutral-200 rounded-lg p-4">
                <div className="text-[13px] font-semibold text-neutral-800">{col.name}</div>
                <div className="text-[11px] text-neutral-400 mb-2">{col.period}</div>
                <p className="text-[12px] text-neutral-600 leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ ...bodyStyle, marginTop: 16 }}>
            There is also a <strong>Released</strong> column. Dragging a card to Released triggers a release note prompt with optional impact metric. Capped at 5 visible items on the board &mdash; a collapse/expand toggle shows older items. Full history at <Link href="/shipped" className="text-[#5E6AD2] hover:underline">/shipped</Link>. Released initiatives also appear on the public <Link href="/releases" className="text-[#5E6AD2] hover:underline">/releases</Link> changelog grouped by month.
          </p>
        </section>

        <SectionDivider />

        {/* Sequencing criteria */}
        <section>
          <h1 id="criteria" style={h1Style}>Why things are sequenced the way they are</h1>
          <p style={bodyStyle}>
            Every initiative has one primary reason for its timing. This is not a priority score &mdash; it&apos;s the dominant constraint or enabler that determined when it ships.
          </p>
          <div className="space-y-2 mt-4">
            {criteria.map((c) => {
              const config = CRITERION_CONFIG[c.key]
              return (
                <div key={c.key} className="flex gap-4 border border-neutral-200 rounded-lg p-4 items-start">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: config.border }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: config.color }}>{config.label}</div>
                    <p className="text-[12px] text-neutral-600 leading-relaxed mt-1">{c.explanation}</p>
                    <p className="text-[11px] text-neutral-400 mt-1 italic">e.g. {c.example}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <SectionDivider />

        {/* Strategic bets */}
        <section>
          <h1 id="strategic-bets" style={h1Style}>Strategic bets</h1>
          <p style={bodyStyle}>
            Some initiatives span the entire year and have too much uncertainty to live as a single card. These appear as banners above the board. Each bet has a current phase (Discovery / Definition / Build / Launch / Done) and links to child initiatives on the main board. Example: Card-linked offers.
          </p>
        </section>

        <SectionDivider />

        {/* Key accounts */}
        <section>
          <h1 id="key-accounts" style={h1Style}>Key account dependencies</h1>
          <p style={bodyStyle}>
            When a business commitment (a partner, a franchise rollout, a regulatory requirement) creates pull on product capacity, it appears as a strip above the board. These are constraints, not initiatives &mdash; they explain why certain cards exist and why capacity may be limited in certain quarters. Example: Steinecke franchise rollout.
          </p>
        </section>

        <SectionDivider />

        {/* Initiative detail */}
        <section>
          <h1 id="initiative-detail" style={h1Style}>What&apos;s on each card</h1>
          <p style={bodyStyle}>
            Clicking any card opens a detail panel. It shows: description, sequencing rationale (derived from criterion), dependency note, linked feature request, Linear sync status, effort estimate, target month, confidence scores (if set), decision log, and reaction bar. Edit from the panel &mdash; changes reflect on the board immediately without a page reload.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Cards with a target month outside their column range show an amber warning badge. Column headers show the full month range (e.g. Jan &rarr; Jun under Now).
          </p>
        </section>

        <SectionDivider />

        {/* Linear sync */}
        <section>
          <h1 id="linear-sync" style={h1Style}>Linear sync</h1>
          <p style={bodyStyle}>
            Initiatives can be linked to Linear projects. Once linked, you can push roadmap data to Linear or pull Linear state back into the roadmap. Pulling from Linear brings in project progress, team members, project lead, milestone, and the last 5 project updates &mdash; shown in the initiative slide-over.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            A daily drift check (runs at midnight) compares both sides and flags differences as an amber indicator on the card. Drift is never auto-resolved &mdash; you always confirm which side wins: apply Linear changes, push roadmap to Linear, or dismiss.
          </p>
        </section>

        <SectionDivider />

        {/* Views */}
        <section>
          <h1 id="views" style={h1Style}>Three ways to see the roadmap</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {views.map((v) => (
              <div key={v.name} className="border border-neutral-200 rounded-lg p-4">
                <div className="text-[13px] font-semibold text-neutral-800 mb-1">{v.name}</div>
                <p className="text-[12px] text-neutral-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
          <h2 style={h2Style}>Public views</h2>
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

        <SectionDivider />

        {/* Stats */}
        <section>
          <h1 id="stats" style={h1Style}>Stats and signals</h1>
          <p style={bodyStyle}>
            The <Link href="/stats" className="text-[#5E6AD2] hover:underline">/stats</Link> page shows initiative distribution by column, strategic level, criterion, effort, and target month. It includes a confidence matrix (problem confidence &times; solution confidence), a capacity planning view based on effort estimates and team size, and target month mismatch detection. Insights are auto-generated from the data &mdash; no AI needed.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            The <Link href="/shipped" className="text-[#5E6AD2] hover:underline">/shipped</Link> page shows everything delivered with release notes, impact metrics, and linked feature requests. Impact data can be added at release time or edited afterwards.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Voice metrics are also shown on the stats page: submission count, active clusters, growing themes, and research candidates.
          </p>
        </section>

        <SectionDivider />

        {/* What we shipped */}
        <section>
          <h1 id="shipped" style={h1Style}>What we shipped</h1>
          <p style={bodyStyle}>
            The <Link href="/shipped" className="text-[#5E6AD2] hover:underline">/shipped</Link> page is the internal product showcase &mdash; everything delivered grouped by month. Each item shows the release note, an optional impact metric (&ldquo;Redemption rate +12% in 30 days&rdquo;), and any feature requests or Voice clusters it fulfilled. It&apos;s designed to be shareable in all-hands decks and leadership reviews. Impact data can be added when releasing or updated afterwards from the initiative slide-over.
          </p>
        </section>

        <SectionDivider />

        {/* Monthly comms digest */}
        <section>
          <h1 id="comms" style={h1Style}>Monthly comms digest</h1>
          <p style={bodyStyle}>
            On the 1st of each month, the comms agent drafts a product digest email covering everything shipped in the previous month. Each shipped item gets a headline framing the problem it solved, expanded release note, impact metric if measured, and a user quote if linked to Voice feedback or a feature request. Stats at the top show items shipped, items with impact data, and user feedback themes actioned. AI drafts using claude-sonnet &mdash; PM has 24 hours to review, edit, and send, or it auto-sends. Manage recipients and review drafts at <Link href="/comms" className="text-[#5E6AD2] hover:underline">/comms</Link>. Internal only &mdash; goes to the team, not users.
          </p>
          <p style={bodyStyle}>
            The digest preview is available at <Link href="/comms/preview" className="text-[#5E6AD2] hover:underline">/comms/preview</Link> &mdash; share this URL with the team before sending so they can see exactly what the email looks like. The preview shows a live countdown to auto-send and a Send now button for the PM to approve from the preview itself.
          </p>
        </section>

        <SectionDivider />

        {/* Feature requests */}
        <section>
          <h1 id="feature-requests" style={h1Style}>Suggesting a feature</h1>
          <p style={bodyStyle}>
            The feature request portal at <Link href="/requests" className="text-[#5E6AD2] hover:underline">/requests</Link> is open to anyone with the link. Submissions follow a Working Backwards format &mdash; you need to articulate the customer problem, current behaviour, desired outcome, success metric, and evidence before submitting. Vague submissions are flagged by AI triage. Requests can be voted on anonymously. The product team can promote a request directly to the roadmap board.
          </p>
        </section>

        <SectionDivider />

        {/* What moves things */}
        <section>
          <h1 id="what-moves-things" style={h1Style}>What moves things</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {movers.map((m) => (
              <div key={m.trigger} className="border border-neutral-200 rounded-lg p-4">
                <div className="text-[12px] font-medium text-neutral-800 mb-1">{m.trigger}</div>
                <p className="text-[12px] text-neutral-500">&rarr; {m.result}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-4">
            Urgency from a stakeholder is not a sequencing criterion. If you believe something should move, use the feature request portal to make the case &mdash; with customer evidence.
          </p>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════ */}
        {/* PART 2 — VOICE DOCUMENTATION               */}
        {/* ═══════════════════════════════════════════ */}

        {/* Voice — Context */}
        <section>
          <h1 id="voice-context" style={{ ...h1Style, fontSize: 26, borderBottom: '2px solid #e5e5e5', paddingBottom: 8 }}>
            Voice &mdash; Context and motivation
          </h1>
          <p style={bodyStyle}>
            NeoTaste has 150,000 email subscribers and a growing user base across multiple German cities. We have strong distribution channels and a clear monetisation model via restaurant vouchers. What we lack is a structured, continuous signal from users about what is working, what is not, and what they wish existed.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Today, user feedback reaches us through fragmented channels: app store reviews, support emails, ad-hoc Slack messages from the commercial team, and occasional user interviews. None of these are systematic. None of them create a searchable record that the product team can reference when making sequencing decisions. The result is that we often rely on internal intuition rather than external evidence when choosing what to build next.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Voice is our response to this gap. It is a lightweight, always-on feedback intake system designed to collect structured user input, triage it with AI, cluster emerging themes, and feed that signal directly into our product planning workflow. It is not a voting board. It is not a public roadmap. It is a research and discovery tool that makes the product team better informed.
          </p>
          <Callout label="What this is not" borderColor="#EF9F27">
            Voice is not a feature voting board. We are not promising to build the most-requested items. We are not running a public wishlist. Voice is a structured signal layer that helps the product team discover problems earlier, cluster emerging themes, and identify users who can help us research and validate solutions.
          </Callout>
        </section>

        <SectionDivider />

        {/* Voice — Goals */}
        <section>
          <h1 id="voice-goals" style={h1Style}>What we are trying to achieve</h1>

          <h2 style={h2Style}>Primary goal: product discovery</h2>
          <p style={bodyStyle}>
            Voice exists to surface problems and opportunities that we would not discover through internal analysis alone. The primary value is in the patterns that emerge across many submissions &mdash; not in any single piece of feedback. When 40 users independently describe difficulty finding restaurants that match their dietary preferences, that is a qualitatively different signal than one team member saying &ldquo;we should add dietary filters.&rdquo;
          </p>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; Surface unmet needs that users cannot articulate as feature requests</li>
            <li style={liStyle}>&ndash; Identify city-specific or segment-specific problems</li>
            <li style={liStyle}>&ndash; Build a research participant pool for faster recruitment</li>
            <li style={liStyle}>&ndash; Create an evidence base that connects user problems to product decisions</li>
          </ul>

          <h2 style={h2Style}>Secondary goal: community and loyalty</h2>
          <p style={bodyStyle}>
            Users who feel heard are more engaged. By acknowledging feedback, clustering it into visible themes, and closing the loop when we act on it, we build a sense of partnership with our most active users. This is not marketing &mdash; it is a genuine commitment to transparency about how user input influences product direction.
          </p>

          <h2 style={h2Style}>What we are not optimising for</h2>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; Volume for its own sake &mdash; a thousand &ldquo;please add dark mode&rdquo; submissions do not make dark mode more important</li>
            <li style={liStyle}>&ndash; Feature voting or popularity ranking &mdash; we do not prioritise by vote count</li>
            <li style={liStyle}>&ndash; Immediate response times &mdash; we commit to reviewing within 30 days, not 30 minutes</li>
            <li style={liStyle}>&ndash; Complete coverage of all user segments &mdash; we start with power users and expand gradually</li>
          </ul>
        </section>

        <SectionDivider />

        {/* Voice — How it works */}
        <section>
          <h1 id="voice-how" style={h1Style}>How Voice works</h1>

          <h2 style={h2Style}>The submission form</h2>
          <p style={bodyStyle}>
            The public form at <Link href="/voice" className="text-[#5E6AD2] hover:underline">/voice</Link> asks users to describe a specific moment or experience. We deliberately do not ask users to propose solutions or request features. The intake is structured around what happened, not what should be built.
          </p>
          <DataTable
            headers={['Field', 'Purpose']}
            rows={[
              ['Describe a moment', "The core signal. We ask users to describe a specific experience, not request a feature. \"I couldn't find a vegan restaurant near Mitte on a Tuesday evening\" is more useful than \"add dietary filters\"."],
              ['Why it mattered', 'Captures the impact and emotional weight. Helps distinguish a minor inconvenience from a real friction point.'],
              ['City (optional)', 'Allows us to spot city-specific problems and recruit participants for local research.'],
              ['Name and email (optional)', 'Enables follow-up notifications and research recruitment. Never shared outside the product team.'],
              ['Research opt-in', "A checkbox: \"I'd be happy to chat with the NeoTaste team about this.\" Builds our research participant pool."],
            ]}
          />

          <h2 style={h2Style}>The AI quality gate</h2>
          <p style={bodyStyle}>
            Every submission is triaged by an AI model that assigns a sentiment (positive, neutral, negative), urgency level (high, medium, low), theme tags, and a quality score from 1 to 5. This is not used for filtering &mdash; all submissions reach the inbox. It is used to help the product team scan submissions efficiently and spot high-urgency items quickly.
          </p>

          <h2 style={h2Style}>Duplicate detection</h2>
          <p style={bodyStyle}>
            Before a user submits, the form checks for similar existing submissions and shows them inline. This serves two purposes: it reduces duplicate volume, and it shows the user that their concern has already been raised by others &mdash; which can itself be reassuring.
          </p>

          <h2 style={h2Style}>AI clustering</h2>
          <p style={bodyStyle}>
            Submissions are embedded as vectors and grouped into clusters based on semantic similarity. This happens asynchronously &mdash; the user never sees it. The clustering surfaces themes that might not be obvious from reading individual submissions.
          </p>
          <ol style={{ ...listStyle, listStyle: 'none' }}>
            <li style={liStyle}>1. Each submission is converted to a vector embedding</li>
            <li style={liStyle}>2. Pairwise similarity is computed across all submissions</li>
            <li style={liStyle}>3. Submissions above a similarity threshold are grouped into clusters</li>
            <li style={liStyle}>4. AI generates a human-readable label for each cluster</li>
          </ol>
          <Callout label="Important" borderColor="#5DCAA5">
            The clustering runs asynchronously after submission &mdash; it never blocks or delays the user&apos;s experience. The first version of clustering uses a word-similarity fallback if the embedding API is unavailable, so the system degrades gracefully.
          </Callout>

          <h2 style={h2Style}>Trend detection</h2>
          <p style={bodyStyle}>
            A daily job analyses the cluster landscape for emerging trends &mdash; new clusters that have appeared or existing clusters that are growing faster than normal. These are surfaced in the internal inbox and the weekly Slack digest.
          </p>

          <h2 style={h2Style}>The PM review layer</h2>
          <p style={bodyStyle}>
            The internal inbox at <Link href="/feedback" className="text-[#5E6AD2] hover:underline">/feedback</Link> is where the product team reviews submissions. Each submission can be marked as reviewing, actioned (linked to a roadmap initiative), archived, or merged with another submission. Internal notes are private and never visible to users.
          </p>

          <h2 style={h2Style}>The researcher CRM</h2>
          <p style={bodyStyle}>
            Users who opt in to research are added to the participant pool at <Link href="/feedback/participants" className="text-[#5E6AD2] hover:underline">/feedback/participants</Link>. The product team can tag participants, track contact history, schedule research sessions, and see all feedback submitted by a specific user. This turns Voice into a recruitment pipeline for user research.
          </p>

          <h2 style={h2Style}>The problem backlog</h2>
          <p style={bodyStyle}>
            Voice clusters do not go directly to the roadmap. When a PM decides a cluster represents a real, validated problem, they graduate it to the problem backlog &mdash; a staging layer that sits between Voice and the roadmap. Items in the backlog have three possible states: Watching (growing signal, not yet validated), Backlog (validated problem, not yet sequenced), or Declined (explicitly not pursuing, with a reason). Only when a backlog item is promoted does it become a roadmap initiative, with a column, criterion, and strategic level assigned. This keeps the roadmap Parked column clean &mdash; it holds deprioritised initiatives, not raw unvalidated problems.
          </p>

          <h2 style={h2Style}>The daily agent</h2>
          <p style={bodyStyle}>
            A daily cron job (runs at 06:00 UTC) processes the previous day&apos;s submissions, recalculates cluster trends, and checks for anomalies &mdash; spikes, new clusters that match existing roadmap initiatives, declined clusters that are reappearing, and high-quality submissions that couldn&apos;t be clustered automatically. If anything noteworthy is found, it posts a briefing to the product Slack channel. The agent prepares information; it makes no decisions. All judgment stays with PMs.
          </p>

          <h2 style={h2Style}>Trend stats</h2>
          <p style={bodyStyle}>
            The <Link href="/feedback/trends" className="text-[#5E6AD2] hover:underline">/feedback/trends</Link> page shows submission volume by strategic area over time, cluster velocity charts, submission quality trends, and system health metrics including response rate. The most important health metric is response rate &mdash; the percentage of clusters that have received a user-facing response. If this drops below 50%, the 30-day commitment is at risk.
          </p>
        </section>

        <SectionDivider />

        {/* Voice — User experience */}
        <section>
          <h1 id="voice-ux" style={h1Style}>What users experience</h1>
          <p style={bodyStyle}>
            Users interact with Voice at a few defined touchpoints. The experience is designed to be respectful of their time and honest about what happens next.
          </p>
          <DataTable
            headers={['Stage', 'What happens']}
            rows={[
              ['Submit', 'User fills in the multi-step form (identity, feedback, context, opt-in). Takes about 2 minutes.'],
              ['Confirmation', 'Immediate thank-you screen. If they provided an email, a confirmation email is sent.'],
              ['Status page', 'Users can check /voice/status with their email to see the current state of all their submissions.'],
              ['Update email', 'When feedback status changes (reviewing, actioned, archived), the user receives an email notification.'],
              ['Research invitation', 'If opted in and selected for research, the user receives a personal invitation from the product team.'],
            ]}
          />
          <Callout label="Our commitment to users" borderColor="#5DCAA5">
            Every cluster will receive a status update within 30 days of reaching a meaningful volume (20+ submissions). The update may be &ldquo;we are planning to work on this&rdquo;, &ldquo;we have decided not to pursue this right now&rdquo;, or &ldquo;we shipped something that addresses this&rdquo;. We do not leave clusters in permanent open status. This commitment is the foundation of user trust in the system.
          </Callout>
        </section>

        <SectionDivider />

        {/* Voice — Risks */}
        <section>
          <h1 id="voice-risks" style={h1Style}>Risks and how we are managing them</h1>
          <DataTable
            headers={['Risk', 'How we manage it']}
            rows={[
              ['Volume overwhelm', 'AI triage handles first pass. Clustering groups similar items automatically. The PM team only reviews aggregated themes, not individual submissions, at scale.'],
              ['Trust erosion', '30-day response commitment per cluster. Status page and email notifications keep users informed. We never silently ignore feedback.'],
              ['Expectation inflation', 'The form makes clear that feedback is used for discovery, not as a feature promise. Confirmation email reinforces this.'],
              ['Vocal minority bias', 'Clustering weights themes by diversity of submitters, not just volume. A theme from 20 different users matters more than 50 submissions from 3 users.'],
              ['Competitive exposure', 'Submissions are never public. The status page only shows the user their own submissions. Cluster labels are internal only.'],
              ['AI clustering errors', 'Clusters are always reviewed by a human before any action is taken. The system surfaces suggestions, not decisions. Bad clusters can be merged, split, or deleted.'],
            ]}
          />
        </section>

        <SectionDivider />

        {/* Voice — Build phases */}
        <section>
          <h1 id="voice-phases" style={h1Style}>Build phases</h1>
          <p style={bodyStyle}>
            Voice is built in three phases, each independently deployable. Each phase adds capability while the previous phase continues to operate.
          </p>
          <DataTable
            headers={['Phase', 'What we build', 'What we learn']}
            rows={[
              ['Phase 1 \u2014 Intake + Triage', 'Submission form, AI triage, internal inbox, research participant tracking, email notifications', 'Whether users will submit structured feedback without incentives. What quality level we get. Whether the AI triage is useful for scanning.'],
              ['Phase 2 \u2014 Clustering', 'Embedding-based clustering, duplicate detection, cluster management UI, trend detection cron, similar feedback suggestions', 'Whether clusters surface useful themes. Whether duplicate detection reduces volume meaningfully. How often clusters align with our existing roadmap.'],
              ['Phase 3 \u2014 CRM + Loop Close', 'Research session tracking, Slack weekly digest, user-facing status page, status notification emails, enhanced participant profiles', 'Whether closing the loop increases future submission quality. Whether the research pipeline generates usable recruits. Whether stakeholders engage with the Slack digest.'],
            ]}
          />
          <Callout label="Rollout approach" borderColor="#5DCAA5">
            We are not opening Voice to all 150,000 subscribers at launch. Phase 1 starts with a cohort of 100&ndash;200 power users &mdash; our most frequent redeemers across two or three cities. This seeds the cluster map with real data before volume builds, and lets us validate the response workflow at manageable scale before committing to the full user base.
          </Callout>
        </section>

        <SectionDivider />

        {/* Voice — Success metrics */}
        <section>
          <h1 id="voice-success" style={h1Style}>What success looks like</h1>

          <h2 style={h2Style}>At 90 days</h2>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; 200+ submissions from the initial cohort with an average quality score above 3.0</li>
            <li style={liStyle}>&ndash; At least 5 meaningful clusters identified and reviewed by the product team</li>
            <li style={liStyle}>&ndash; At least 1 roadmap initiative directly informed by a Voice cluster</li>
            <li style={liStyle}>&ndash; 30+ research participants recruited through the opt-in flow</li>
            <li style={liStyle}>&ndash; Response rate above 70% &mdash; more than two-thirds of clusters have had a response sent to users</li>
            <li style={liStyle}>&ndash; Daily agent has flagged at least one anomaly that led to a PM action</li>
          </ul>

          <h2 style={h2Style}>At 6 months</h2>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; Voice clusters are referenced in at least 3 initiative decision logs on the roadmap</li>
            <li style={liStyle}>&ndash; Research recruitment time (from need to first interview) drops below 5 business days</li>
            <li style={liStyle}>&ndash; The weekly Slack digest is read by at least 80% of the product and commercial team</li>
            <li style={liStyle}>&ndash; User trust metrics: at least 20% of submitters return to submit a second time</li>
          </ul>

          <h2 style={h2Style}>What would cause us to stop</h2>
          <p style={bodyStyle}>
            Voice is not a permanent commitment if it does not deliver value. We would consider shutting it down if:
          </p>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; After 90 days, fewer than 50 total submissions have been received despite active promotion</li>
            <li style={liStyle}>&ndash; The product team does not reference Voice data in any sequencing decision within 6 months</li>
            <li style={liStyle}>&ndash; Users express more frustration than value from the feedback process (measured via follow-up survey)</li>
          </ul>
        </section>

        <SectionDivider />

        {/* Voice — Where to find things */}
        <section>
          <h1 id="voice-where" style={h1Style}>Where to find things</h1>
          <DataTable
            headers={['URL', 'What it is']}
            rows={[
              ['/voice', 'The consumer-facing feedback form. Shareable with users.'],
              ['/voice/status', 'User-facing status lookup page. Enter email to see submission status.'],
              ['/feedback', 'Internal inbox. Where the product team reviews and triages submissions.'],
              ['/feedback/participants', 'Research participant list. Tagging, contact tracking, session history.'],
              ['/feedback/backlog', 'Problem backlog staging layer between clusters and roadmap.'],
              ['/feedback/trends', 'Trend charts and system health metrics.'],
              ['/feedback/agent', 'Daily agent run history and manual trigger.'],
              ['/shipped', 'Internal showcase of everything delivered, grouped by month with impact data.'],
              ['/comms', 'Monthly digest management — generate, review, edit, send, manage recipients.'],
              ['/stats', 'Stats page. Includes Voice metrics alongside roadmap analytics.'],
              ['/how-it-works', 'This page. Unified documentation for the roadmap and Voice.'],
              ['/requests', 'Feature request portal with Working Backwards intake.'],
              ['/releases', 'Public changelog of shipped initiatives.'],
              ['voice.neotaste-voice.vercel.app', 'Standalone Voice submission form (separate Vercel project, public).'],
            ]}
          />
          <h2 style={h2Style}>Slack digest</h2>
          <p style={bodyStyle}>
            A weekly summary is posted to Slack every Monday at 8am UTC. It includes new submission count, top clusters, sentiment breakdown, and unreviewed count. The digest is informational &mdash; it does not require action, but it keeps the broader team aware of what users are saying.
          </p>
        </section>

        <SectionDivider />

        {/* Voice — Principles */}
        <section>
          <h1 id="voice-principles" style={h1Style}>Operating principles</h1>

          <h2 style={h2Style}>Users deserve honest responses, not marketing language</h2>
          <p style={bodyStyle}>
            When we respond to feedback, we use plain language. &ldquo;We have decided not to build this right now because the effort does not justify the expected impact for this quarter&rdquo; is better than &ldquo;Thank you for your feedback! We&apos;re always looking for ways to improve.&rdquo; Users can tell the difference.
          </p>

          <h2 style={h2Style}>Volume is a feature, not a problem, if it is structured</h2>
          <p style={bodyStyle}>
            The AI triage, clustering, and trend detection exist precisely so that volume becomes useful rather than overwhelming. A system that breaks at 500 submissions is not designed well. Voice is built to scale to thousands of submissions while keeping the PM review burden manageable.
          </p>

          <h2 style={h2Style}>The research pipeline is as valuable as the product signal</h2>
          <p style={bodyStyle}>
            Every user who opts in to research is a potential participant for future studies. Building this pool systematically &mdash; with tags, contact history, and session tracking &mdash; means we can recruit for user research in hours instead of weeks. This is a compounding advantage.
          </p>

          <h2 style={h2Style}>We do not promise what we cannot deliver</h2>
          <p style={bodyStyle}>
            The form, the confirmation email, the status page, and the update emails all use the same tone: we read everything, we take it seriously, and we will tell you what we decided. We never imply that submitting feedback guarantees that something will be built. The commitment is to listen and respond, not to comply.
          </p>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════ */}
        {/* PART 3 — META                              */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tool changelog */}
        <section>
          <h1 id="tool-changelog" style={{ ...h1Style, fontSize: 26, borderBottom: '2px solid #e5e5e5', paddingBottom: 8 }}>
            Tool changelog
          </h1>
          <p style={{ ...bodyStyle, marginBottom: 20 }}>
            A record of features added to this tool since launch.
          </p>
          <ToolChangelog />
        </section>

        <SectionDivider />

        {/* Docs changelog */}
        <section>
          <h1 id="docs-changelog" style={h1Style}>Documentation changelog</h1>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>A record of updates to this document.</p>

          {[
            {
              date: '2026-03-18',
              summary: 'Minor fix notes added to changelog.',
              sections_updated: ['Tool changelog'],
            },
            {
              date: '2026-03-18',
              summary: 'Updated comms digest section with preview page and recipient management details.',
              sections_updated: ['Monthly comms digest'],
            },
            {
              date: '2026-03-18',
              summary: 'Added monthly comms digest documentation and /comms to where to find things.',
              sections_updated: ['Monthly comms digest', 'Where to find things'],
            },
            {
              date: '2026-03-18',
              summary: 'Added /shipped showcase, comms digest, Voice standalone app, password gate removal, trend stats, problem backlog, and daily agent to changelog and documentation.',
              sections_updated: ['What the columns mean', 'Stats and signals', 'What we shipped', 'Monthly comms digest', 'Voice — Where to find things'],
            },
            {
              date: '2026-03-17',
              summary: 'Merged /docs and /how-it-works into a single unified documentation page.',
              sections_updated: ['All'],
            },
            {
              date: '2026-03-17',
              summary: 'Added problem backlog, daily agent, and trend stats sections.',
              sections_updated: ['How Voice works', 'Success metrics', 'Where to find things'],
            },
            {
              date: '2026-03-16',
              summary: 'Initial Voice documentation published covering all three build phases.',
              sections_updated: ['All Voice sections'],
            },
          ].map((entry, i) => (
            <div key={i} style={{ marginBottom: 12, padding: '8px 0', borderBottom: '0.5px solid #e5e5e5' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{entry.date}</div>
              <div style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>{entry.summary}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                {entry.sections_updated.map((s) => (
                  <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: '#f5f5f5', color: '#999' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0 0', borderTop: '0.5px solid #e5e5e5', marginTop: 40 }}>
          <p style={{ fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 6 }}>
            Questions about the roadmap or Voice? Reach out to the product team.
          </p>
          <p style={{ fontSize: 12, color: '#999' }}>
            NeoTaste Internal &middot; Not for external distribution
          </p>
        </div>
      </DocsSidebar>
    </main>
  )
}
