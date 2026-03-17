'use client'

import { useState } from 'react'

// TOOL CHANGELOG
// Add new entries at the TOP of this array when shipping new features.
// Format: { date: 'YYYY-MM-DD', title: '...', description: '...', category: '...' }
// Categories: core | board | integration | analytics | portal | sharing
const TOOL_CHANGELOG = [
  {
    date: '2026-03-18',
    title: 'Runtime env diagnostics + API key hardening',
    description: 'Added /api/env-check runtime diagnostic endpoint. Applied .trim() to all ANTHROPIC_API_KEY reads to prevent hidden whitespace issues.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: 'Anthropic API key diagnosis and fix',
    description: 'Diagnosed and fixed Anthropic API authentication error in comms digest generation.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: 'Fix comms digest generation error',
    description: 'Fixed server action error handling in generateMonthlyDigest. Added structured error returns and logging. Verified ANTHROPIC_API_KEY requirement.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: 'Fix Linear sync log display and Comms nav link',
    description: 'Linear sync log entries now show human-readable text instead of raw JSON. Comms page added to top navigation.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: 'Comms digest — recipient management and preview page',
    description: 'Improved recipient management with bulk email paste, role tagging, and inline editing. Added /comms/preview — a shareable full-page email preview with live auto-send countdown and one-click send.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: 'Monthly comms digest agent',
    description: 'AI drafts a monthly internal product digest email using claude-sonnet-4-6. Covers everything shipped, impact metrics, Voice themes, and feature requests resolved. PM has 24h to review and edit before auto-send. Manage at /comms. Also fixes Voice shipped notification and origin email hardening.',
    category: 'core',
  },
  {
    date: '2026-03-18',
    title: '/shipped — internal product showcase',
    description: 'New page at /shipped showing everything delivered grouped by month. Each item shows release note, impact metric (optional), and linked feature requests fulfilled. Released column on board capped at 5 visible items with collapse toggle.',
    category: 'board',
  },
  {
    date: '2026-03-18',
    title: 'Voice standalone app',
    description: 'Voice feedback portal moved to a separate Vercel project (neotaste-voice) with its own URL. Shares the same Neon database. No internal nav or links to the roadmap — fully isolated for public user access.',
    category: 'portal',
  },
  {
    date: '2026-03-17',
    title: 'Password gate removed',
    description: 'Temporary password gate removed from the roadmap app. All internal routes are now open. Google SSO prompt is stored and ready to implement when needed.',
    category: 'core',
  },
  {
    date: '2026-03-17',
    title: 'Voice unified docs + seed data',
    description: '/docs and /how-it-works merged into a single page at /how-it-works with two sections: roadmap guide and Voice documentation. Voice portal seeded with 32 realistic submissions across 5 clusters and 4 European cities.',
    category: 'portal',
  },
  {
    date: '2026-03-17',
    title: 'Voice trend stats and problem backlog',
    description: 'Trend charts at /feedback/trends showing submission volume by strategic area, cluster velocity, city breakdown, and system health. Problem backlog at /feedback/backlog as a staging layer between Voice clusters and the roadmap.',
    category: 'portal',
  },
  {
    date: '2026-03-17',
    title: 'Voice daily agent',
    description: 'Daily cron (06:00 UTC) processes submissions, detects anomalies, checks watching items, suggests cluster merges, and posts a Slack briefing if anything noteworthy. Agent history and manual trigger at /feedback/agent.',
    category: 'portal',
  },
  {
    date: '2026-03-17',
    title: 'Voice — Problem backlog',
    description: 'Staging layer between Voice clusters and the roadmap at /feedback/backlog. Items move through Watching → Backlog → Promoted/Declined. Clusters graduate to the backlog instead of going directly to the roadmap.',
    category: 'portal',
  },
  {
    date: '2026-03-17',
    title: 'Voice — Daily agent',
    description: 'AI cron job (06:00 UTC) processes submissions, detects anomalies (spikes, initiative matches, reappearing declined clusters), checks overdue watching items, suggests cluster merges, and posts a Slack briefing.',
    category: 'analytics',
  },
  {
    date: '2026-03-17',
    title: 'Voice — Trend stats',
    description: 'Dedicated /feedback/trends page with CSS-based charts: submission volume by strategic area, cluster velocity, signal quality over time, and system health metrics including response rate and backlog flow.',
    category: 'analytics',
  },
  {
    date: '2026-03-17',
    title: 'Unified documentation page',
    description: 'Merged /docs and /how-it-works into a single unified page at /how-it-works. Two-part structure: roadmap guide + Voice documentation. Grouped sidebar navigation. /docs redirects permanently.',
    category: 'core',
  },
  {
    date: '2026-03-16',
    title: 'Voice — Slack weekly digest',
    description: 'Weekly Slack digest (Monday 8am UTC) summarizes new submissions, top clusters, sentiment breakdown, and unreviewed count. Requires SLACK_WEBHOOK_URL env variable.',
    category: 'integration',
  },
  {
    date: '2026-03-16',
    title: 'Voice — User feedback status page',
    description: 'Consumers can check feedback status at /voice/status by entering their email. Shows submission timeline with status progression (submitted → reviewing → actioned).',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Voice — Research CRM',
    description: 'Enhanced participant management at /feedback/participants with session tracking (interviews, surveys, usability tests), participant detail panel, submission history, and contact logging.',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Voice — Status notification emails',
    description: 'When feedback status changes (reviewing, actioned, archived), the submitter receives an email notification. Integrates with existing Resend email service.',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Voice — AI clustering engine',
    description: 'Feedback submissions are embedded using Voyage AI (with word-overlap fallback) and clustered by cosine similarity. Daily cron at 2am UTC. Cluster management UI in the inbox with merge, status, and initiative linking.',
    category: 'analytics',
  },
  {
    date: '2026-03-16',
    title: 'Voice — Similar feedback detection',
    description: 'When submitting feedback, users see similar existing submissions before confirming. Helps reduce duplicates while still allowing submissions from different perspectives.',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Voice — Consumer feedback portal',
    description: 'New consumer-facing feedback form at /voice with multi-step intake, AI triage, and research opt-in. Internal inbox at /feedback with status management, AI analysis, and initiative linking.',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Research participant tracking',
    description: 'Users who opt in to research are tracked at /feedback/participants. Manual add, tagging, contact tracking, and participant management.',
    category: 'portal',
  },
  {
    date: '2026-03-16',
    title: 'Voice nav badge',
    description: 'Nav shows unreviewed feedback count as a red badge on the Voice link. Updates on every page load.',
    category: 'core',
  },
  {
    date: '2026-03-16',
    title: 'Key account edit flow',
    description: 'Key account strips on the board now have edit, delete, link, and unlink functionality. Changes reflect immediately without a page reload.',
    category: 'board',
  },
  {
    date: '2026-03-16',
    title: 'Linear drift detection',
    description: 'Daily sync check compares Linear project state to roadmap. Amber badge on cards with detected drift. Resolve by applying Linear changes, pushing roadmap to Linear, or dismissing.',
    category: 'integration',
  },
  {
    date: '2026-03-16',
    title: 'Enhanced Linear pull',
    description: 'Pulling from Linear now brings in project progress, team members, project lead, milestone, and the last 5 project updates \u2014 shown in the initiative slide-over.',
    category: 'integration',
  },
  {
    date: '2026-03-15',
    title: 'Target month / column mismatch warnings',
    description: 'Cards with a target month outside their column range show an amber warning badge. Column headers now show the full month range (e.g. Jan \u2192 Jun under Now).',
    category: 'board',
  },
  {
    date: '2026-03-15',
    title: 'Parked criterion auto-moves card',
    description: 'Setting an initiative\u2019s criterion to Parked automatically moves it to the Parked column. Dragging to Parked auto-sets the criterion.',
    category: 'board',
  },
  {
    date: '2026-03-15',
    title: 'Strategic bets and key account dependencies',
    description: 'Parent initiatives (year-spanning strategic bets) appear as banners above the board with phase tracking and linked child initiatives. Key account strips show business commitments that create capacity constraints.',
    category: 'board',
  },
  {
    date: '2026-03-15',
    title: 'Released column and public changelog',
    description: 'Dragging a card to Released triggers a release note prompt. Released initiatives appear on the public /releases changelog grouped by month.',
    category: 'board',
  },
  {
    date: '2026-03-14',
    title: 'Linear integration \u2014 Phase 1',
    description: 'Push initiatives to Linear projects, pull Linear state back, import from Linear, and link existing initiatives to Linear projects. Sync log tracks all push/pull history.',
    category: 'integration',
  },
  {
    date: '2026-03-14',
    title: 'View modes: swimlane and list',
    description: 'Toggle between Board, Swimlane (by strategic level), and List (sortable table with CSV export) using the segmented control in the filter bar.',
    category: 'board',
  },
  {
    date: '2026-03-14',
    title: 'Target month overlay',
    description: 'Optional target month field on each initiative. Shows as a small badge on cards. Stats page includes monthly distribution chart.',
    category: 'board',
  },
  {
    date: '2026-03-14',
    title: 'Effort estimates',
    description: 'T-shirt size effort field (XS \u2192 XL) on each initiative. Stats page shows effort distribution and a capacity planning view based on team size.',
    category: 'board',
  },
  {
    date: '2026-03-14',
    title: 'Public board and stakeholder view',
    description: '/public shows initiatives marked as public. /stakeholder is a simplified view for non-product stakeholders. Both are shareable without login.',
    category: 'sharing',
  },
  {
    date: '2026-03-14',
    title: 'Stats and insights page',
    description: '/stats shows distribution by column, strategic level, criterion, effort, and month. Auto-generated insight sentences flag bottlenecks and imbalances.',
    category: 'analytics',
  },
  {
    date: '2026-03-13',
    title: 'Feature request portal',
    description: 'Public portal at /requests for submitting and voting on feature requests. Working Backwards intake form. AI triage suggests strategic level and flags weak evidence. Requests can be promoted directly to the roadmap.',
    category: 'portal',
  },
  {
    date: '2026-03-13',
    title: 'Activity log',
    description: 'All mutations (moves, edits, releases, promotions, votes) are logged to /activity with actor name, field changed, and before/after values.',
    category: 'core',
  },
  {
    date: '2026-03-13',
    title: 'Dynamic strategic levels',
    description: 'Strategic levels (Discovery, Churn, etc.) are DB-driven and manageable from /settings. Each has a color used throughout the board.',
    category: 'core',
  },
  {
    date: '2026-03-13',
    title: 'NeoTaste branding and navigation',
    description: 'Dark green nav with NeoTaste logo, brand green accent, and Made by Agus footer. Consistent across all pages.',
    category: 'core',
  },
  {
    date: '2026-03-12',
    title: 'Initial launch',
    description: 'Board with Now / Next / Later / Parked columns. Initiative cards with criterion color coding. Drag and drop. Search and track filters. Add, edit, delete initiatives.',
    category: 'core',
  },
]

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  core:        { label: 'Core',        color: '#888780', bg: '#F1EFE8' },
  board:       { label: 'Board',       color: '#085041', bg: '#E1F5EE' },
  integration: { label: 'Integration', color: '#3C3489', bg: '#EEEDFE' },
  analytics:   { label: 'Analytics',   color: '#0C447C', bg: '#E6F1FB' },
  portal:      { label: 'Portal',      color: '#633806', bg: '#FAEEDA' },
  sharing:     { label: 'Sharing',     color: '#712B13', bg: '#FAECE7' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ToolChangelog() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = activeCategory
    ? TOOL_CHANGELOG.filter((e) => e.category === activeCategory)
    : TOOL_CHANGELOG

  // Group by date
  const grouped: { date: string; entries: typeof TOOL_CHANGELOG }[] = []
  for (const entry of filtered) {
    const existing = grouped.find((g) => g.date === entry.date)
    if (existing) {
      existing.entries.push(entry)
    } else {
      grouped.push({ date: entry.date, entries: [entry] })
    }
  }

  const categories = Object.entries(CATEGORY_CONFIG)

  return (
    <div>
      {/* Category filters */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors"
          style={
            activeCategory === null
              ? { backgroundColor: '#0D2818', color: '#fff', borderColor: '#0D2818' }
              : { backgroundColor: '#fff', color: '#666', borderColor: '#e5e5e5' }
          }
        >
          All
        </button>
        {categories.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors"
            style={
              activeCategory === key
                ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }
                : { backgroundColor: '#fff', color: '#666', borderColor: '#e5e5e5' }
            }
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {grouped.map((group, gi) => (
          <div key={group.date}>
            {gi > 0 && <hr className="my-6 border-neutral-100" />}
            <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-4">
              {formatDate(group.date)}
            </div>
            <div className="space-y-4">
              {group.entries.map((entry) => {
                const cat = CATEGORY_CONFIG[entry.category]
                return (
                  <div key={entry.title} className="flex gap-3">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                      <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#999' }}
                      />
                      <div className="w-px flex-1 bg-neutral-200 mt-1" />
                    </div>
                    {/* Content */}
                    <div className="pb-2 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cat && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: cat.bg, color: cat.color }}
                          >
                            {cat.label}
                          </span>
                        )}
                        <span className="text-[13px] font-medium text-neutral-800">
                          {entry.title}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500 leading-[1.6]">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[12px] text-neutral-400 italic">No entries in this category.</p>
      )}
    </div>
  )
}
