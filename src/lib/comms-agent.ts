import { db } from '@/db'
import { initiatives, strategicLevels, featureRequests, feedbackClusters, feedbackSubmissions, activityLog } from '@/db/schema'
import { eq, and, between, sql, desc } from 'drizzle-orm'

export interface ShippedItem {
  id: string
  title: string
  release_note: string
  impact_metric: string | null
  impact_measured_at: Date | null
  strategic_level_name: string
  strategic_level_color: string
  released_at: Date
  linked_requests: { title: string; vote_count: number }[]
  cluster_title: string | null
  cluster_submission_count: number
}

export interface DigestData {
  period_label: string
  period_start: string
  period_end: string
  shipped: ShippedItem[]
  shipped_count: number
  items_with_impact: number
  voice_clusters_actioned: number
  roadmap_moves: { title: string; from_column: string; to_column: string }[]
  top_voice_theme: { title: string; submission_count: number; trend: string } | null
  new_voice_submissions: number
  feature_requests_resolved: number
  should_send: boolean
  skip_reason: string | null
}

export async function buildDigestData(periodStart: Date, periodEnd: Date): Promise<DigestData> {
  const periodLabel = periodStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Shipped initiatives in period
  const shippedRows = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      release_note: initiatives.release_note,
      impact_metric: initiatives.impact_metric,
      impact_measured_at: initiatives.impact_measured_at,
      released_at: initiatives.released_at,
      level_name: strategicLevels.name,
      level_color: strategicLevels.color,
    })
    .from(initiatives)
    .leftJoin(strategicLevels, eq(initiatives.strategic_level_id, strategicLevels.id))
    .where(
      and(
        eq(initiatives.column, 'released'),
        sql`${initiatives.released_at} >= ${periodStart.toISOString()}`,
        sql`${initiatives.released_at} <= ${periodEnd.toISOString()}`
      )
    )
    .orderBy(desc(initiatives.released_at))

  // Build shipped items with linked data
  const shipped: ShippedItem[] = []
  for (const row of shippedRows) {
    // Linked feature requests
    const linkedRequests = await db
      .select({ title: featureRequests.title, vote_count: featureRequests.vote_count })
      .from(featureRequests)
      .where(eq(featureRequests.roadmap_initiative_id, row.id))

    // Linked Voice cluster
    const linkedCluster = await db
      .select({ label: feedbackClusters.label, submission_count: feedbackClusters.submission_count })
      .from(feedbackClusters)
      .where(eq(feedbackClusters.linked_initiative_id, row.id))
      .limit(1)

    shipped.push({
      id: row.id,
      title: row.title,
      release_note: row.release_note ?? '',
      impact_metric: row.impact_metric || null,
      impact_measured_at: row.impact_measured_at ?? null,
      strategic_level_name: row.level_name ?? '',
      strategic_level_color: row.level_color ?? '#999',
      released_at: row.released_at ?? new Date(),
      linked_requests: linkedRequests.map(r => ({
        title: r.title,
        vote_count: r.vote_count ?? 0,
      })),
      cluster_title: linkedCluster.length > 0 ? linkedCluster[0].label : null,
      cluster_submission_count: linkedCluster.length > 0 ? (linkedCluster[0].submission_count ?? 0) : 0,
    })
  }

  // Roadmap moves from activity log
  const moveRows = await db
    .select({ metadata: activityLog.metadata })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.action, 'moved'),
        sql`${activityLog.created_at} >= ${periodStart.toISOString()}`,
        sql`${activityLog.created_at} <= ${periodEnd.toISOString()}`
      )
    )
    .limit(10)

  const roadmapMoves: { title: string; from_column: string; to_column: string }[] = []
  for (const row of moveRows) {
    try {
      const meta = JSON.parse(row.metadata ?? '{}')
      if (meta.title && meta.from && meta.to) {
        roadmapMoves.push({ title: meta.title, from_column: meta.from, to_column: meta.to })
      }
    } catch { /* ignore */ }
  }

  // Voice clusters actioned
  const clustersActioned = await db
    .select({ id: feedbackClusters.id })
    .from(feedbackClusters)
    .where(
      and(
        sql`${feedbackClusters.status} IN ('planned', 'resolved')`,
        sql`${feedbackClusters.updated_at} >= ${periodStart.toISOString()}`,
        sql`${feedbackClusters.updated_at} <= ${periodEnd.toISOString()}`
      )
    )

  // Top Voice theme
  const topTheme = await db
    .select({
      label: feedbackClusters.label,
      submission_count: feedbackClusters.submission_count,
    })
    .from(feedbackClusters)
    .where(eq(feedbackClusters.status, 'active'))
    .orderBy(desc(feedbackClusters.submission_count))
    .limit(1)

  // New Voice submissions
  const [submissionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackSubmissions)
    .where(
      and(
        sql`${feedbackSubmissions.created_at} >= ${periodStart.toISOString()}`,
        sql`${feedbackSubmissions.created_at} <= ${periodEnd.toISOString()}`
      )
    )

  // Feature requests resolved
  const [requestsResolved] = await db
    .select({ count: sql<number>`count(*)` })
    .from(featureRequests)
    .where(
      and(
        sql`${featureRequests.status} IN ('planned', 'declined', 'promoted')`,
        sql`${featureRequests.created_at} >= ${periodStart.toISOString()}`,
        sql`${featureRequests.created_at} <= ${periodEnd.toISOString()}`
      )
    )

  const data: DigestData = {
    period_label: periodLabel,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    shipped,
    shipped_count: shipped.length,
    items_with_impact: shipped.filter(s => s.impact_metric).length,
    voice_clusters_actioned: clustersActioned.length,
    roadmap_moves: roadmapMoves.slice(0, 5),
    top_voice_theme: topTheme.length > 0
      ? { title: topTheme[0].label, submission_count: topTheme[0].submission_count ?? 0, trend: 'growing' }
      : null,
    new_voice_submissions: Number(submissionCount?.count ?? 0),
    feature_requests_resolved: Number(requestsResolved?.count ?? 0),
    should_send: true,
    skip_reason: null,
  }

  // Threshold
  if (data.shipped_count < 1) {
    data.should_send = false
    data.skip_reason = `Only ${data.shipped_count} item${data.shipped_count === 1 ? '' : 's'} shipped — rolling into next month`
  }

  return data
}

export async function generateDigestDraft(data: DigestData): Promise<{ subject: string; html: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set or is empty')
  }

  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error(`ANTHROPIC_API_KEY appears malformed — prefix: ${apiKey.substring(0, 10)}`)
  }

  const prompt = `
You are writing a monthly internal product digest email for NeoTaste, a restaurant deal subscription app operating in European cities.

This email goes to the entire NeoTaste team — engineers, designers, PMs, leadership, commercial.

Tone: warm, specific, celebratory. Not corporate. Not a status report.
Every shipped item represents real work by real people. Treat it that way.
Write as if you genuinely care about the people who built these things.
ICs and managers receive the same email — no hierarchy in the framing.
This is internal PR for the product team. Make them feel proud.

Period: ${data.period_label}

What shipped:
${data.shipped.map(item => `
Title: ${item.title}
Strategic area: ${item.strategic_level_name}
Release note: ${item.release_note}
Impact: ${item.impact_metric ?? 'not yet measured'}
Linked user requests: ${item.linked_requests.length > 0 ? item.linked_requests.map(r => r.title).join(', ') : 'none'}
From Voice feedback: ${item.cluster_title ? `"${item.cluster_title}" — ${item.cluster_submission_count} user submissions` : 'no'}
`).join('\n---\n')}

Other signals this month:
- ${data.new_voice_submissions} new Voice feedback submissions
- ${data.voice_clusters_actioned} feedback themes actioned
- ${data.feature_requests_resolved} feature requests resolved
${data.top_voice_theme ? `- Top growing user theme: "${data.top_voice_theme.title}" (${data.top_voice_theme.submission_count} submissions)` : ''}

Instructions:
1. Subject line: specific, not generic. Reference something real. E.g. "Map pins, dietary filters, and 3 more — March at NeoTaste Product"
2. Opening (3-4 sentences): set the tone, acknowledge the month, make people feel the momentum
3. For each shipped item: a headline that frames the PROBLEM SOLVED not the feature name, then 2-3 sentences expanding the release note, then impact if available, then user signal if linked to Voice or feature requests
4. Voice/user section if notable: what users are telling us, what we responded to
5. Closing (2-3 sentences): what's coming, what the team should feel proud of

Respond ONLY with this JSON structure, no markdown fences:
{
  "subject": "...",
  "opening": "...",
  "items": [
    {
      "title": "original initiative title",
      "headline": "problem-focused headline",
      "body": "2-3 sentences",
      "impact": "impact line or null",
      "user_signal": "quote or signal from user feedback or null"
    }
  ],
  "voice_section": "2-3 sentences about user feedback themes or null",
  "closing": "..."
}
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(`Anthropic API error (${response.status}): ${result.error?.message ?? JSON.stringify(result)}`)
  }
  if (!result.content?.[0]?.text) {
    throw new Error('Anthropic API returned empty content')
  }
  const text = result.content[0].text
  let draft: { subject: string; opening: string; items: { title: string; headline: string; body: string; impact: string | null; user_signal: string | null }[]; voice_section: string | null; closing: string }
  try {
    draft = JSON.parse(text)
  } catch {
    throw new Error(`Failed to parse Anthropic response as JSON: ${text.slice(0, 200)}`)
  }
  const { renderDigestEmail } = await import('@/lib/digest-email-template')
  const html = renderDigestEmail(draft, data)
  return { subject: draft.subject, html }
}
