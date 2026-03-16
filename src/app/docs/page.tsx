import type { Metadata } from 'next'
import Link from 'next/link'
import DocsSidebar from '@/components/docs/DocsSidebar'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Voice — Internal Documentation · NeoTaste',
  description: 'How the Voice user feedback system works, why we built it, and what we expect from it.',
}

/* ── Reusable components ── */

function SectionDivider() {
  return <hr className="my-10 border-neutral-200" />
}

function Callout({ label, color, borderColor, children }: { label: string; color: string; borderColor: string; children: React.ReactNode }) {
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
          <tr key={i} style={{ background: i % 2 === 0 ? 'var(--color-background-secondary, #FAFAF9)' : 'var(--color-background-primary, #FFFFFF)' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '8px 12px', fontWeight: j === 0 ? 500 : 400, color: j === 0 ? 'var(--color-text-primary, #1a1a1a)' : 'var(--color-text-secondary, #555)', borderBottom: '0.5px solid var(--color-border-tertiary, #e5e5e5)', verticalAlign: 'top' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Styles ── */

const h1Style = { fontSize: 26, fontWeight: 600, color: 'var(--nt-dark, #0D2818)', borderBottom: '2px solid var(--color-border-tertiary, #e5e5e5)', paddingBottom: 8, marginBottom: 16 } as const
const h2Style = { fontSize: 20, fontWeight: 500, color: 'var(--nt-dark, #0D2818)', marginTop: 28, marginBottom: 12 } as const
const h3Style = { fontSize: 16, fontWeight: 500, color: 'var(--nt-dark, #0D2818)', marginTop: 20, marginBottom: 8 } as const
const bodyStyle = { fontSize: 14, lineHeight: 1.8, color: 'var(--color-text-secondary, #555)' } as const
const listStyle = { listStyle: 'none', padding: 0, margin: '12px 0 12px 20px' } as const
const liStyle = { fontSize: 14, lineHeight: 1.8, color: 'var(--color-text-secondary, #555)', marginBottom: 6 } as const

/* ── Page ── */

export default function DocsPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background-primary, #FFFFFF)', padding: '48px 24px' }}>
      <DocsSidebar>
        {/* Cover block */}
        <div style={{ background: 'var(--nt-dark, #0D2818)', borderRadius: 12, padding: '32px 36px', marginBottom: 40 }}>
          <p style={{ fontSize: 12, color: '#50E88A', fontWeight: 500, marginBottom: 8 }}>
            NeoTaste &middot; Internal documentation
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#FFFFFF', marginBottom: 12, lineHeight: 1.2 }}>
            Voice &mdash; User Feedback System
          </h1>
          <p style={{ fontSize: 14, color: '#AAAAAA', marginBottom: 24, lineHeight: 1.6 }}>
            How it works, why we built it, and what we expect from it
          </p>
          <p style={{ fontSize: 12, color: '#666666' }}>March 2026 &middot; Product team</p>
        </div>

        {/* Last updated */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-tertiary, #999)', marginBottom: 32 }}>
          <span>Last updated: March 2026</span>
          <span>&middot;</span>
          <span>Product team</span>
          <span>&middot;</span>
          <Link href="/voice" style={{ color: 'var(--nt-green, #50E88A)' }}>See /voice &rarr;</Link>
        </div>

        {/* ─── Section 1 — Context ─── */}
        <section>
          <h1 id="context" style={h1Style}>Context and motivation</h1>
          <p style={bodyStyle}>
            NeoTaste has 150,000 email subscribers and a growing user base across multiple German cities. We have strong distribution channels and a clear monetisation model via restaurant vouchers. What we lack is a structured, continuous signal from users about what is working, what is not, and what they wish existed.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Today, user feedback reaches us through fragmented channels: app store reviews, support emails, ad-hoc Slack messages from the commercial team, and occasional user interviews. None of these are systematic. None of them create a searchable record that the product team can reference when making sequencing decisions. The result is that we often rely on internal intuition rather than external evidence when choosing what to build next.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Voice is our response to this gap. It is a lightweight, always-on feedback intake system designed to collect structured user input, triage it with AI, cluster emerging themes, and feed that signal directly into our product planning workflow. It is not a voting board. It is not a public roadmap. It is a research and discovery tool that makes the product team better informed.
          </p>

          <Callout label="What this is not" color="#633806" borderColor="#EF9F27">
            Voice is not a feature voting board. We are not promising to build the most-requested items. We are not running a public wishlist. Voice is a structured signal layer that helps the product team discover problems earlier, cluster emerging themes, and identify users who can help us research and validate solutions.
          </Callout>
        </section>

        <SectionDivider />

        {/* ─── Section 2 — Goals ─── */}
        <section>
          <h1 id="goals" style={h1Style}>What we are trying to achieve</h1>

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

        {/* ─── Section 3 — How it works ─── */}
        <section>
          <h1 id="how-it-works" style={h1Style}>How Voice works</h1>

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
          <ol style={{ ...listStyle, listStyle: 'none', counterReset: 'step' }}>
            <li style={{ ...liStyle, counterIncrement: 'step' }}>1. Each submission is converted to a vector embedding</li>
            <li style={{ ...liStyle, counterIncrement: 'step' }}>2. Pairwise similarity is computed across all submissions</li>
            <li style={{ ...liStyle, counterIncrement: 'step' }}>3. Submissions above a similarity threshold are grouped into clusters</li>
            <li style={{ ...liStyle, counterIncrement: 'step' }}>4. AI generates a human-readable label for each cluster</li>
          </ol>

          <Callout label="Important" color="#085041" borderColor="#5DCAA5">
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
        </section>

        <SectionDivider />

        {/* ─── Section 4 — User experience ─── */}
        <section>
          <h1 id="user-experience" style={h1Style}>What users experience</h1>
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

          <Callout label="Our commitment to users" color="#085041" borderColor="#5DCAA5">
            Every cluster will receive a status update within 30 days of reaching a meaningful volume (20+ submissions). The update may be &ldquo;we are planning to work on this&rdquo;, &ldquo;we have decided not to pursue this right now&rdquo;, or &ldquo;we shipped something that addresses this&rdquo;. We do not leave clusters in permanent open status. This commitment is the foundation of user trust in the system.
          </Callout>
        </section>

        <SectionDivider />

        {/* ─── Section 5 — Risks ─── */}
        <section>
          <h1 id="risks" style={h1Style}>Risks and how we are managing them</h1>

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

        {/* ─── Section 6 — Build phases ─── */}
        <section>
          <h1 id="phases" style={h1Style}>Build phases</h1>
          <p style={bodyStyle}>
            Voice is built in three phases, each independently deployable. Each phase adds capability while the previous phase continues to operate.
          </p>

          <DataTable
            headers={['Phase', 'What we build', 'What we learn']}
            rows={[
              ['Phase 1 — Intake + Triage', 'Submission form, AI triage, internal inbox, research participant tracking, email notifications', 'Whether users will submit structured feedback without incentives. What quality level we get. Whether the AI triage is useful for scanning.'],
              ['Phase 2 — Clustering', 'Embedding-based clustering, duplicate detection, cluster management UI, trend detection cron, similar feedback suggestions', 'Whether clusters surface useful themes. Whether duplicate detection reduces volume meaningfully. How often clusters align with our existing roadmap.'],
              ['Phase 3 — CRM + Loop Close', 'Research session tracking, Slack weekly digest, user-facing status page, status notification emails, enhanced participant profiles', 'Whether closing the loop increases future submission quality. Whether the research pipeline generates usable recruits. Whether stakeholders engage with the Slack digest.'],
            ]}
          />

          <Callout label="Rollout approach" color="#085041" borderColor="#5DCAA5">
            We are not opening Voice to all 150,000 subscribers at launch. Phase 1 starts with a cohort of 100&ndash;200 power users &mdash; our most frequent redeemers across two or three cities. This seeds the cluster map with real data before volume builds, and lets us validate the response workflow at manageable scale before committing to the full user base.
          </Callout>
        </section>

        <SectionDivider />

        {/* ─── Section 7 — Success metrics ─── */}
        <section>
          <h1 id="success" style={h1Style}>What success looks like</h1>

          <h2 style={h2Style}>At 90 days</h2>
          <ul style={listStyle}>
            <li style={liStyle}>&ndash; 200+ submissions from the initial cohort with an average quality score above 3.0</li>
            <li style={liStyle}>&ndash; At least 5 meaningful clusters identified and reviewed by the product team</li>
            <li style={liStyle}>&ndash; At least 1 roadmap initiative directly informed by a Voice cluster</li>
            <li style={liStyle}>&ndash; 30+ research participants recruited through the opt-in flow</li>
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

        {/* ─── Section 8 — Where to find things ─── */}
        <section>
          <h1 id="where" style={h1Style}>Where to find things</h1>

          <DataTable
            headers={['URL', 'What it is']}
            rows={[
              ['/voice', 'The consumer-facing feedback form. Shareable with users.'],
              ['/voice/status', 'User-facing status lookup page. Enter email to see submission status.'],
              ['/feedback', 'Internal inbox. Where the product team reviews and triages submissions.'],
              ['/feedback/participants', 'Research participant list. Tagging, contact tracking, session history.'],
              ['/docs', 'This page. Internal documentation for the Voice system.'],
              ['/stats', 'Stats page. Includes Voice metrics alongside roadmap analytics.'],
              ['/how-it-works', 'How this roadmap works page. Includes a section on Voice.'],
            ]}
          />

          <h2 style={h2Style}>Slack digest</h2>
          <p style={bodyStyle}>
            A weekly summary is posted to Slack every Monday at 9am UTC. It includes new submission count, top clusters, sentiment breakdown, and unreviewed count. The digest is informational &mdash; it does not require action, but it keeps the broader team aware of what users are saying.
          </p>
        </section>

        <SectionDivider />

        {/* ─── Section 9 — Principles ─── */}
        <section>
          <h1 id="principles" style={h1Style}>Operating principles</h1>

          <h3 style={h3Style}>Users deserve honest responses, not marketing language</h3>
          <p style={bodyStyle}>
            When we respond to feedback, we use plain language. &ldquo;We have decided not to build this right now because the effort does not justify the expected impact for this quarter&rdquo; is better than &ldquo;Thank you for your feedback! We&apos;re always looking for ways to improve.&rdquo; Users can tell the difference.
          </p>

          <h3 style={h3Style}>Volume is a feature, not a problem, if it is structured</h3>
          <p style={bodyStyle}>
            The AI triage, clustering, and trend detection exist precisely so that volume becomes useful rather than overwhelming. A system that breaks at 500 submissions is not designed well. Voice is built to scale to thousands of submissions while keeping the PM review burden manageable.
          </p>

          <h3 style={h3Style}>The research pipeline is as valuable as the product signal</h3>
          <p style={bodyStyle}>
            Every user who opts in to research is a potential participant for future studies. Building this pool systematically &mdash; with tags, contact history, and session tracking &mdash; means we can recruit for user research in hours instead of weeks. This is a compounding advantage.
          </p>

          <h3 style={h3Style}>We do not promise what we cannot deliver</h3>
          <p style={bodyStyle}>
            The form, the confirmation email, the status page, and the update emails all use the same tone: we read everything, we take it seriously, and we will tell you what we decided. We never imply that submitting feedback guarantees that something will be built. The commitment is to listen and respond, not to comply.
          </p>
        </section>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0 0', borderTop: '0.5px solid var(--color-border-tertiary, #e5e5e5)', marginTop: 40 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary, #999)', fontStyle: 'italic', marginBottom: 6 }}>
            Questions about Voice? Reach out to the product team.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary, #999)' }}>
            NeoTaste Internal &middot; Not for external distribution
          </p>
        </div>
      </DocsSidebar>
    </main>
  )
}
