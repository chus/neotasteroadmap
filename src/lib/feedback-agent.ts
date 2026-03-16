import { db } from '@/db'
import { feedbackSubmissions, feedbackClusters, initiatives, agentRunLog, problemBacklog } from '@/db/schema'
import { eq, desc, sql, and, isNull, isNotNull, gte } from 'drizzle-orm'

export interface AgentAnomaly {
  type: 'spike' | 'new_cluster_matches_initiative' | 'cluster_declined_reappearing' | 'zero_submissions'
  description: string
  severity: 'high' | 'medium' | 'low'
  entity_id?: string
}

export interface AgentReport {
  date: string
  newSubmissions: number
  newClusters: number
  growingClusters: { id: string; title: string; delta: number }[]
  anomalies: AgentAnomaly[]
  watchingItemsDue: { id: string; title: string; daysOverdue: number }[]
  mergeSuggestions: { clusterA: string; clusterB: string; similarity: number; titles: [string, string] }[]
  unclusteredHighQuality: { id: string; summary: string; quality_score: number }[]
  slackPosted: boolean
}

export async function runFeedbackAgent(): Promise<AgentReport> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)

  // Step 1 — Process unprocessed submissions
  const recentUnClustered = await db.select({ id: feedbackSubmissions.id })
    .from(feedbackSubmissions)
    .where(and(
      gte(feedbackSubmissions.created_at, yesterday),
      isNull(feedbackSubmissions.cluster_id),
      isNotNull(feedbackSubmissions.embedding),
    ))

  let newSubmissions = 0
  try {
    const { embedFeedback, runClustering } = await import('@/app/feedback-actions')

    // Embed un-embedded recent submissions
    const unEmbedded = await db.select({ id: feedbackSubmissions.id })
      .from(feedbackSubmissions)
      .where(and(
        gte(feedbackSubmissions.created_at, yesterday),
        isNull(feedbackSubmissions.embedding),
      ))

    for (const sub of unEmbedded) {
      await embedFeedback(sub.id)
      if (unEmbedded.indexOf(sub) < unEmbedded.length - 1) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    newSubmissions = unEmbedded.length + recentUnClustered.length

    // Step 2 — Run clustering
    await runClustering()
  } catch {
    // Continue even if clustering fails
  }

  // Count new clusters (created in last 24h)
  const newClusterRows = await db.select({ id: feedbackClusters.id, label: feedbackClusters.label })
    .from(feedbackClusters)
    .where(gte(feedbackClusters.created_at, yesterday))
  const newClusters = newClusterRows.length

  // Step 3 — Detect anomalies
  const anomalies: AgentAnomaly[] = []

  // Spike detection
  const allClusters = await db.select().from(feedbackClusters)
    .where(eq(feedbackClusters.status, 'active'))

  for (const cluster of allClusters) {
    const [last24h] = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, cluster.id),
        gte(feedbackSubmissions.created_at, yesterday),
      ))

    const dailyAvg = (cluster.submission_count ?? 0) / 30
    const count24h = last24h?.count ?? 0

    if (count24h > dailyAvg * 2 && count24h >= 3) {
      anomalies.push({
        type: 'spike',
        description: `Cluster "${cluster.label}" spiked — ${count24h} submissions in 24h (avg: ${dailyAvg.toFixed(1)}/day)`,
        severity: 'high',
        entity_id: cluster.id,
      })
    }
  }

  // New cluster matches existing initiative
  const allInitiatives = await db.select({ id: initiatives.id, title: initiatives.title })
    .from(initiatives).limit(200)

  for (const newCluster of newClusterRows) {
    for (const init of allInitiatives) {
      if (titleSimilarity(newCluster.label, init.title) > 0.6) {
        anomalies.push({
          type: 'new_cluster_matches_initiative',
          description: `New cluster "${newCluster.label}" matches initiative "${init.title}"`,
          severity: 'medium',
          entity_id: newCluster.id,
        })
        break
      }
    }
  }

  // Declined cluster reappearing
  const declinedClusters = await db.select().from(feedbackClusters)
    .where(eq(feedbackClusters.status, 'resolved'))

  for (const dc of declinedClusters) {
    const [recentCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, dc.id),
        gte(feedbackSubmissions.created_at, sevenDaysAgo),
      ))
    if ((recentCount?.count ?? 0) >= 5) {
      anomalies.push({
        type: 'cluster_declined_reappearing',
        description: `Resolved cluster "${dc.label}" received ${recentCount?.count} submissions in the last 7 days`,
        severity: 'medium',
        entity_id: dc.id,
      })
    }
  }

  // Zero submissions on open clusters (14+ days)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  for (const cluster of allClusters) {
    const [recentCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, cluster.id),
        gte(feedbackSubmissions.created_at, fourteenDaysAgo),
      ))
    if ((recentCount?.count ?? 0) === 0 && (cluster.submission_count ?? 0) > 0) {
      anomalies.push({
        type: 'zero_submissions',
        description: `Active cluster "${cluster.label}" has had zero submissions for 14+ days`,
        severity: 'low',
        entity_id: cluster.id,
      })
    }
  }

  // Growing clusters
  const growingClusters: AgentReport['growingClusters'] = []
  for (const cluster of allClusters) {
    const [weekCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, cluster.id),
        gte(feedbackSubmissions.created_at, sevenDaysAgo),
      ))
    const delta = weekCount?.count ?? 0
    if (delta > 0) {
      growingClusters.push({ id: cluster.id, title: cluster.label, delta })
    }
  }
  growingClusters.sort((a, b) => b.delta - a.delta)

  // Step 4 — Check watching items due
  const today = now.toISOString().split('T')[0]
  const watchingDue = await db.select().from(problemBacklog)
    .where(and(
      eq(problemBacklog.status, 'watching'),
    ))

  const watchingItemsDue = watchingDue
    .filter((item) => item.watch_until && item.watch_until <= today)
    .map((item) => ({
      id: item.id,
      title: item.title,
      daysOverdue: Math.ceil((now.getTime() - new Date(item.watch_until!).getTime()) / (1000 * 60 * 60 * 24)),
    }))

  // Step 5 — Suggest cluster merges
  const mergeSuggestions: AgentReport['mergeSuggestions'] = []
  const matureClusters = allClusters.filter((c) => {
    const age = (now.getTime() - new Date(c.created_at!).getTime()) / (1000 * 60 * 60 * 24)
    return age > 7
  })

  // Get embeddings for mature clusters via their submissions
  const clusterEmbeddings: { id: string; label: string; embedding: number[] }[] = []
  for (const cluster of matureClusters.slice(0, 20)) {
    const subs = await db.select({ embedding: feedbackSubmissions.embedding })
      .from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, cluster.id),
        isNotNull(feedbackSubmissions.embedding),
      ))
      .limit(1)

    if (subs.length > 0 && subs[0].embedding) {
      clusterEmbeddings.push({
        id: cluster.id,
        label: cluster.label,
        embedding: JSON.parse(subs[0].embedding),
      })
    }
  }

  const { cosineSimilarity } = await import('@/lib/embeddings')
  for (let i = 0; i < clusterEmbeddings.length; i++) {
    for (let j = i + 1; j < clusterEmbeddings.length; j++) {
      const sim = cosineSimilarity(clusterEmbeddings[i].embedding, clusterEmbeddings[j].embedding)
      if (sim > 0.78) {
        mergeSuggestions.push({
          clusterA: clusterEmbeddings[i].id,
          clusterB: clusterEmbeddings[j].id,
          similarity: Math.round(sim * 100),
          titles: [clusterEmbeddings[i].label, clusterEmbeddings[j].label],
        })
      }
    }
    if (mergeSuggestions.length >= 3) break
  }

  // Step 6 — Flag unclustered high-quality submissions
  const unclusteredHighQuality: AgentReport['unclusteredHighQuality'] = []
  const unclustered = await db.select()
    .from(feedbackSubmissions)
    .where(and(
      isNull(feedbackSubmissions.cluster_id),
      isNotNull(feedbackSubmissions.ai_triage),
      gte(feedbackSubmissions.created_at, sixHoursAgo),
    ))

  for (const sub of unclustered) {
    try {
      const triage = JSON.parse(sub.ai_triage ?? '{}')
      if (triage.quality_score >= 4) {
        unclusteredHighQuality.push({
          id: sub.id,
          summary: triage.summary ?? sub.title,
          quality_score: triage.quality_score,
        })
      }
    } catch {}
  }

  // Step 7 — Post Slack briefing
  let slackPosted = false
  const hasContent = newSubmissions > 0 || anomalies.length > 0 || watchingItemsDue.length > 0
    || mergeSuggestions.length > 0 || unclusteredHighQuality.length > 0

  if (hasContent && process.env.SLACK_WEBHOOK_URL) {
    try {
      const { sendSlackMessage } = await import('@/lib/slack')
      const blocks = buildAgentSlackBlocks({
        date: now.toISOString().split('T')[0],
        newSubmissions,
        newClusters,
        growingClusters: growingClusters.slice(0, 5),
        anomalies,
        watchingItemsDue,
        mergeSuggestions,
        unclusteredHighQuality,
      })
      await sendSlackMessage(process.env.SLACK_WEBHOOK_URL, { blocks })
      slackPosted = true
    } catch {
      // Non-critical
    }
  }

  // Step 8 — Store agent report
  const report: AgentReport = {
    date: now.toISOString().split('T')[0],
    newSubmissions,
    newClusters,
    growingClusters: growingClusters.slice(0, 10),
    anomalies,
    watchingItemsDue,
    mergeSuggestions,
    unclusteredHighQuality,
    slackPosted,
  }

  await db.insert(agentRunLog).values({
    run_date: report.date,
    report: JSON.stringify(report),
    slack_posted: slackPosted,
  })

  return report
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let overlap = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++
  }
  return overlap / Math.min(wordsA.size, wordsB.size)
}

function buildAgentSlackBlocks(data: {
  date: string
  newSubmissions: number
  newClusters: number
  growingClusters: AgentReport['growingClusters']
  anomalies: AgentAnomaly[]
  watchingItemsDue: AgentReport['watchingItemsDue']
  mergeSuggestions: AgentReport['mergeSuggestions']
  unclusteredHighQuality: AgentReport['unclusteredHighQuality']
}): object[] {
  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'NeoTaste Voice — daily briefing', emoji: true },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: data.date }],
    },
  ]

  // Yesterday
  if (data.newSubmissions > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Yesterday*\n• ${data.newSubmissions} new submission${data.newSubmissions !== 1 ? 's' : ''}${data.newClusters > 0 ? ` — created ${data.newClusters} new cluster${data.newClusters !== 1 ? 's' : ''}` : ''}`,
      },
    })
  }

  // Anomalies
  if (data.anomalies.length > 0) {
    const lines = data.anomalies.map((a) => {
      const sev = a.severity === 'high' ? '[HIGH]' : a.severity === 'medium' ? '[MED]' : '[LOW]'
      return `• ${sev} ${a.description}`
    })
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Anomalies*\n${lines.join('\n')}` },
    })
  }

  // Growing themes
  if (data.growingClusters.length > 0) {
    const lines = data.growingClusters.map((c) => `• "${c.title}" — +${c.delta} this week`)
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Growing themes*\n${lines.join('\n')}` },
    })
  }

  // Watching items due
  if (data.watchingItemsDue.length > 0) {
    const lines = data.watchingItemsDue.map((w) => `• "${w.title}" — ${w.daysOverdue} day${w.daysOverdue !== 1 ? 's' : ''} overdue`)
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Review needed*\n${lines.join('\n')}` },
    })
  }

  // Merge suggestions
  if (data.mergeSuggestions.length > 0) {
    const lines = data.mergeSuggestions.map((m) => `• "${m.titles[0]}" + "${m.titles[1]}" (${m.similarity}% similar)`)
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Merge suggestions*\n${lines.join('\n')}` },
    })
  }

  // Unclustered high quality
  if (data.unclusteredHighQuality.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Unclustered high-quality submissions*\n• ${data.unclusteredHighQuality.length} specific submission${data.unclusteredHighQuality.length !== 1 ? 's' : ''} didn't match any cluster — review manually`,
      },
    })
  }

  // Footer links
  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: '<https://neotasteroadmap.vercel.app/feedback/backlog|View backlog>' },
      { type: 'mrkdwn', text: '<https://neotasteroadmap.vercel.app/feedback|Open clusters>' },
    ],
  })

  return blocks
}
