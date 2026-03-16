'use server'

import { db } from '@/db'
import { feedbackSubmissions, researchParticipants, activityLog, initiatives, feedbackClusters, researchSessions, problemBacklog, agentRunLog, strategicLevels } from '@/db/schema'
import { eq, desc, sql, asc, and, ilike, isNull, isNotNull, lte, gte } from 'drizzle-orm'
import type { FeedbackSubmission, FeedbackStatus, FeedbackCategory, UserType, ResearchParticipant, FeedbackCluster, ClusterStatus, ResearchSession, SessionType, ProblemBacklogItem, BacklogStatus, AgentRunLogEntry } from '@/types'

// ─── Submission ───

export async function submitFeedback(data: {
  name: string
  email: string
  user_type: string
  category: string
  title: string
  body: string
  restaurant_name?: string
  order_context?: string
  device?: string
  app_version?: string
  research_opt_in: boolean
}): Promise<{ success: boolean; id: string | null }> {
  try {
    const [row] = await db.insert(feedbackSubmissions).values({
      name: data.name,
      email: data.email,
      user_type: data.user_type,
      category: data.category,
      title: data.title,
      body: data.body,
      restaurant_name: data.restaurant_name || null,
      order_context: data.order_context || null,
      device: data.device || null,
      app_version: data.app_version || null,
      research_opt_in: data.research_opt_in,
    }).returning({ id: feedbackSubmissions.id })

    // Upsert research participant if opted in
    if (data.research_opt_in && data.email) {
      try {
        await db.insert(researchParticipants).values({
          name: data.name,
          email: data.email,
          user_type: data.user_type,
          source: 'voice_form',
        }).onConflictDoNothing()
      } catch {
        // Non-critical — don't fail submission
      }
    }

    // Log activity
    await db.insert(activityLog).values({
      action: 'feedback_submitted',
      entity_type: 'feedback',
      entity_id: row.id,
      metadata: JSON.stringify({ title: data.title, category: data.category, user_type: data.user_type }),
    })

    // Fire-and-forget AI triage
    triageFeedbackSubmission(row.id).catch(() => {})

    // Fire-and-forget confirmation email
    if (data.email) {
      sendConfirmationEmail(data.email, data.name, data.title, data.research_opt_in).catch(() => {})
    }

    return { success: true, id: row.id }
  } catch (err) {
    console.error('[feedback] Submit error:', err)
    return { success: false, id: null }
  }
}

async function sendConfirmationEmail(email: string, name: string, title: string, researchOptIn: boolean) {
  try {
    const { sendEmail } = await import('@/lib/email')
    const { feedbackConfirmation } = await import('@/lib/voice-email-templates')
    const { subject, html } = feedbackConfirmation(name, title, researchOptIn)
    await sendEmail(email, subject, html)
  } catch {
    // Best-effort
  }
}

// ─── AI Triage ───

export async function triageFeedbackSubmission(id: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const [submission] = await db.select().from(feedbackSubmissions).where(eq(feedbackSubmissions.id, id))
  if (!submission) return

  const prompt = `You are a consumer feedback triage assistant for NeoTaste, a restaurant discovery and voucher app. Analyze this user feedback and return a JSON object.

Feedback:
- Title: ${submission.title}
- Body: ${submission.body}
- Category: ${submission.category}
- User type: ${submission.user_type}
- Restaurant: ${submission.restaurant_name || 'Not specified'}
- Context: ${submission.order_context || 'Not specified'}

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "sentiment": "positive | neutral | negative",
  "urgency": "high | medium | low",
  "themes": ["array", "of", "theme", "keywords"],
  "quality_score": 1-5,
  "summary": "one sentence summary",
  "suggested_action": "one sentence recommendation for the product team"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return

    const result = await response.json()
    const text = result.content?.[0]?.text
    if (!text) return

    // Validate it's valid JSON
    JSON.parse(text)

    await db.update(feedbackSubmissions).set({
      ai_triage: text,
      ai_triaged_at: new Date(),
    }).where(eq(feedbackSubmissions.id, id))
  } catch {
    // Silently fail — triage is best-effort
  }
}

export async function retriggerTriage(id: string) {
  await db.update(feedbackSubmissions).set({
    ai_triage: null,
    ai_triaged_at: null,
  }).where(eq(feedbackSubmissions.id, id))
  await triageFeedbackSubmission(id)
}

// ─── Inbox Queries ───

export async function getFeedbackSubmissions(filters?: {
  status?: FeedbackStatus
  category?: FeedbackCategory
  user_type?: UserType
  search?: string
}): Promise<FeedbackSubmission[]> {
  const conditions = []

  if (filters?.status) {
    conditions.push(eq(feedbackSubmissions.status, filters.status))
  }
  if (filters?.category) {
    conditions.push(eq(feedbackSubmissions.category, filters.category))
  }
  if (filters?.user_type) {
    conditions.push(eq(feedbackSubmissions.user_type, filters.user_type))
  }
  if (filters?.search) {
    conditions.push(
      ilike(feedbackSubmissions.title, `%${filters.search}%`)
    )
  }

  const rows = conditions.length > 0
    ? await db.select().from(feedbackSubmissions).where(and(...conditions)).orderBy(desc(feedbackSubmissions.created_at))
    : await db.select().from(feedbackSubmissions).orderBy(desc(feedbackSubmissions.created_at))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    user_type: r.user_type as UserType,
    category: r.category as FeedbackCategory,
    title: r.title,
    body: r.body,
    restaurant_name: r.restaurant_name,
    order_context: r.order_context as FeedbackSubmission['order_context'],
    device: r.device,
    app_version: r.app_version,
    ai_triage: r.ai_triage,
    ai_triaged_at: r.ai_triaged_at,
    status: r.status as FeedbackStatus,
    internal_note: r.internal_note ?? '',
    actioned_initiative_id: r.actioned_initiative_id,
    research_opt_in: r.research_opt_in,
    embedding: r.embedding,
    cluster_id: r.cluster_id,
    status_notified_at: r.status_notified_at,
    created_at: r.created_at!,
    reviewed_at: r.reviewed_at,
    reviewed_by: r.reviewed_by,
  }))
}

export async function getUnreviewedFeedbackCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.status, 'new'))
  return result?.count ?? 0
}

// ─── Status Management ───

export async function updateFeedbackStatus(id: string, status: FeedbackStatus, reviewerName?: string) {
  await db.update(feedbackSubmissions).set({
    status,
    reviewed_at: new Date(),
    reviewed_by: reviewerName || null,
  }).where(eq(feedbackSubmissions.id, id))

  await db.insert(activityLog).values({
    action: 'feedback_status_changed',
    entity_type: 'feedback',
    entity_id: id,
    metadata: JSON.stringify({ status, reviewed_by: reviewerName }),
  })

  // Fire-and-forget status notification
  notifyFeedbackStatusChange(id).catch(() => {})
}

export async function updateFeedbackNote(id: string, note: string) {
  await db.update(feedbackSubmissions).set({
    internal_note: note,
  }).where(eq(feedbackSubmissions.id, id))
}

export async function actionFeedback(id: string, initiativeId: string) {
  await db.update(feedbackSubmissions).set({
    status: 'actioned',
    actioned_initiative_id: initiativeId,
    reviewed_at: new Date(),
  }).where(eq(feedbackSubmissions.id, id))

  await db.insert(activityLog).values({
    action: 'feedback_actioned',
    entity_type: 'feedback',
    entity_id: id,
    metadata: JSON.stringify({ initiative_id: initiativeId }),
  })
}

export async function archiveFeedback(id: string) {
  await updateFeedbackStatus(id, 'archived')
}

export async function mergeFeedback(sourceId: string, targetId: string) {
  await db.update(feedbackSubmissions).set({
    status: 'merged',
    internal_note: sql`COALESCE(${feedbackSubmissions.internal_note}, '') || ' [Merged into ' || ${targetId} || ']'`,
  }).where(eq(feedbackSubmissions.id, sourceId))

  await db.insert(activityLog).values({
    action: 'feedback_merged',
    entity_type: 'feedback',
    entity_id: sourceId,
    metadata: JSON.stringify({ merged_into: targetId }),
  })
}

// ─── Research Participants ───

export async function getResearchParticipants(filters?: {
  user_type?: UserType
  search?: string
}): Promise<ResearchParticipant[]> {
  const conditions = []

  if (filters?.user_type) {
    conditions.push(eq(researchParticipants.user_type, filters.user_type))
  }
  if (filters?.search) {
    conditions.push(
      ilike(researchParticipants.name, `%${filters.search}%`)
    )
  }

  const rows = conditions.length > 0
    ? await db.select().from(researchParticipants).where(and(...conditions)).orderBy(desc(researchParticipants.created_at))
    : await db.select().from(researchParticipants).orderBy(desc(researchParticipants.created_at))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    user_type: r.user_type as UserType,
    source: r.source,
    tags: r.tags ?? '[]',
    notes: r.notes ?? '',
    last_contacted_at: r.last_contacted_at,
    contact_count: r.contact_count ?? 0,
    opted_in_at: r.opted_in_at!,
    created_at: r.created_at!,
  }))
}

export async function addResearchParticipant(data: {
  name: string
  email: string
  user_type: string
  source?: string
  tags?: string
  notes?: string
}) {
  await db.insert(researchParticipants).values({
    name: data.name,
    email: data.email,
    user_type: data.user_type,
    source: data.source || 'manual',
    tags: data.tags || '[]',
    notes: data.notes || '',
  })
}

export async function updateParticipant(id: string, data: {
  name?: string
  tags?: string
  notes?: string
}) {
  await db.update(researchParticipants).set(data).where(eq(researchParticipants.id, id))
}

export async function deleteParticipant(id: string) {
  await db.delete(researchParticipants).where(eq(researchParticipants.id, id))
}

export async function markContacted(id: string) {
  await db.update(researchParticipants).set({
    contact_count: sql`COALESCE(${researchParticipants.contact_count}, 0) + 1`,
    last_contacted_at: new Date(),
  }).where(eq(researchParticipants.id, id))
}

// ─── Initiative search (for action linking) ───

export async function searchInitiativesForAction(query: string) {
  if (!query.trim()) return []
  const rows = await db
    .select({ id: initiatives.id, title: initiatives.title, column: initiatives.column })
    .from(initiatives)
    .where(ilike(initiatives.title, `%${query}%`))
    .orderBy(asc(initiatives.position))
    .limit(8)
  return rows
}

// ─── Phase 2: Embeddings & Clustering ───

export async function embedFeedback(id: string) {
  const [submission] = await db.select().from(feedbackSubmissions).where(eq(feedbackSubmissions.id, id))
  if (!submission) return

  const { getEmbedding } = await import('@/lib/embeddings')
  const text = `${submission.title} ${submission.body}`
  const embedding = await getEmbedding(text)

  await db.update(feedbackSubmissions).set({
    embedding: JSON.stringify(embedding),
  }).where(eq(feedbackSubmissions.id, id))
}

export async function runClustering(): Promise<{ clustersCreated: number; submissionsAssigned: number }> {
  // Get all submissions with embeddings but no cluster
  const unClustered = await db.select().from(feedbackSubmissions)
    .where(and(isNotNull(feedbackSubmissions.embedding), isNull(feedbackSubmissions.cluster_id)))

  if (unClustered.length === 0) return { clustersCreated: 0, submissionsAssigned: 0 }

  const { cosineSimilarity } = await import('@/lib/embeddings')

  // Parse embeddings
  const items = unClustered.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    embedding: JSON.parse(s.embedding!) as number[],
    ai_triage: s.ai_triage,
  }))

  // Get existing clusters and their submissions for assignment
  const existingClusters = await db.select().from(feedbackClusters).where(eq(feedbackClusters.status, 'active'))
  const existingClusteredSubs = existingClusters.length > 0
    ? await db.select().from(feedbackSubmissions).where(isNotNull(feedbackSubmissions.cluster_id))
    : []

  // Try to assign to existing clusters first
  const assigned: { subId: string; clusterId: string }[] = []
  const remaining: typeof items = []

  for (const item of items) {
    let bestCluster: string | null = null
    let bestScore = 0.75 // threshold

    for (const existing of existingClusteredSubs) {
      if (!existing.embedding) continue
      const score = cosineSimilarity(item.embedding, JSON.parse(existing.embedding))
      if (score > bestScore) {
        bestScore = score
        bestCluster = existing.cluster_id
      }
    }

    if (bestCluster) {
      assigned.push({ subId: item.id, clusterId: bestCluster })
    } else {
      remaining.push(item)
    }
  }

  // Cluster remaining items among themselves
  const newClusters: { members: typeof items }[] = []
  const used = new Set<string>()

  for (let i = 0; i < remaining.length; i++) {
    if (used.has(remaining[i].id)) continue

    const cluster = [remaining[i]]
    used.add(remaining[i].id)

    for (let j = i + 1; j < remaining.length; j++) {
      if (used.has(remaining[j].id)) continue
      const score = cosineSimilarity(remaining[i].embedding, remaining[j].embedding)
      if (score >= 0.75) {
        cluster.push(remaining[j])
        used.add(remaining[j].id)
      }
    }

    if (cluster.length >= 2) {
      newClusters.push({ members: cluster })
    }
  }

  let clustersCreated = 0
  let submissionsAssigned = assigned.length

  // Create new clusters and assign submissions
  for (const cluster of newClusters) {
    const label = await generateClusterLabel(cluster.members.map((m) => m.title))

    // Compute sentiment stats
    const sentiments = cluster.members.map((m) => {
      try { return JSON.parse(m.ai_triage ?? '{}').sentiment } catch { return null }
    }).filter(Boolean)
    const urgencies = cluster.members.map((m) => {
      try { return JSON.parse(m.ai_triage ?? '{}').urgency } catch { return null }
    }).filter(Boolean)

    const [newCluster] = await db.insert(feedbackClusters).values({
      label,
      submission_count: cluster.members.length,
      avg_sentiment: mode(sentiments),
      top_urgency: highestUrgency(urgencies),
    }).returning({ id: feedbackClusters.id })

    for (const member of cluster.members) {
      await db.update(feedbackSubmissions).set({ cluster_id: newCluster.id }).where(eq(feedbackSubmissions.id, member.id))
    }

    clustersCreated++
    submissionsAssigned += cluster.members.length
  }

  // Assign to existing clusters
  for (const { subId, clusterId } of assigned) {
    await db.update(feedbackSubmissions).set({ cluster_id: clusterId }).where(eq(feedbackSubmissions.id, subId))
  }

  // Update submission counts on existing clusters
  for (const cluster of existingClusters) {
    const [count] = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedbackSubmissions).where(eq(feedbackSubmissions.cluster_id!, cluster.id))
    await db.update(feedbackClusters).set({
      submission_count: count?.count ?? 0,
      updated_at: new Date(),
    }).where(eq(feedbackClusters.id, cluster.id))
  }

  return { clustersCreated, submissionsAssigned }
}

async function generateClusterLabel(titles: string[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return titles[0] ?? 'Unnamed cluster'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 64,
        messages: [{
          role: 'user',
          content: `These are similar user feedback submissions:\n${titles.map((t) => `- ${t}`).join('\n')}\n\nGenerate a short label (3-6 words) that describes the common theme. Return ONLY the label, no quotes, no punctuation.`,
        }],
      }),
    })
    if (!response.ok) return titles[0] ?? 'Unnamed cluster'
    const result = await response.json()
    return result.content?.[0]?.text?.trim() ?? titles[0] ?? 'Unnamed cluster'
  } catch {
    return titles[0] ?? 'Unnamed cluster'
  }
}

function mode(arr: string[]): string | null {
  if (arr.length === 0) return null
  const counts: Record<string, number> = {}
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function highestUrgency(arr: string[]): string | null {
  if (arr.length === 0) return null
  if (arr.includes('high')) return 'high'
  if (arr.includes('medium')) return 'medium'
  return 'low'
}

export async function getClusters(): Promise<FeedbackCluster[]> {
  const rows = await db.select().from(feedbackClusters).orderBy(desc(feedbackClusters.submission_count))
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description ?? '',
    theme: r.theme ?? '',
    submission_count: r.submission_count ?? 0,
    avg_sentiment: r.avg_sentiment,
    top_urgency: r.top_urgency,
    status: r.status as ClusterStatus,
    linked_initiative_id: r.linked_initiative_id,
    backlog_item_id: r.backlog_item_id,
    created_at: r.created_at!,
    updated_at: r.updated_at!,
  }))
}

export async function getClusterSubmissions(clusterId: string): Promise<FeedbackSubmission[]> {
  const rows = await db.select().from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.cluster_id!, clusterId))
    .orderBy(desc(feedbackSubmissions.created_at))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    user_type: r.user_type as UserType,
    category: r.category as FeedbackCategory,
    title: r.title,
    body: r.body,
    restaurant_name: r.restaurant_name,
    order_context: r.order_context as FeedbackSubmission['order_context'],
    device: r.device,
    app_version: r.app_version,
    ai_triage: r.ai_triage,
    ai_triaged_at: r.ai_triaged_at,
    status: r.status as FeedbackStatus,
    internal_note: r.internal_note ?? '',
    actioned_initiative_id: r.actioned_initiative_id,
    research_opt_in: r.research_opt_in,
    embedding: r.embedding,
    cluster_id: r.cluster_id,
    status_notified_at: r.status_notified_at,
    created_at: r.created_at!,
    reviewed_at: r.reviewed_at,
    reviewed_by: r.reviewed_by,
  }))
}

export async function updateCluster(id: string, data: {
  label?: string
  description?: string
  status?: ClusterStatus
  linked_initiative_id?: string | null
}) {
  await db.update(feedbackClusters).set({
    ...data,
    updated_at: new Date(),
  }).where(eq(feedbackClusters.id, id))
}

export async function mergeClusters(sourceId: string, targetId: string) {
  // Move all submissions from source to target
  await db.update(feedbackSubmissions).set({ cluster_id: targetId })
    .where(eq(feedbackSubmissions.cluster_id!, sourceId))

  // Update target count
  const [count] = await db.select({ count: sql<number>`count(*)::int` })
    .from(feedbackSubmissions).where(eq(feedbackSubmissions.cluster_id!, targetId))
  await db.update(feedbackClusters).set({
    submission_count: count?.count ?? 0,
    updated_at: new Date(),
  }).where(eq(feedbackClusters.id, targetId))

  // Delete source
  await db.delete(feedbackClusters).where(eq(feedbackClusters.id, sourceId))
}

export async function getSimilarFeedback(text: string): Promise<{ id: string; title: string; score: number }[]> {
  const { getEmbedding, findSimilar } = await import('@/lib/embeddings')

  const embedding = await getEmbedding(text)

  const existing = await db.select({
    id: feedbackSubmissions.id,
    title: feedbackSubmissions.title,
    embedding: feedbackSubmissions.embedding,
  }).from(feedbackSubmissions)
    .where(isNotNull(feedbackSubmissions.embedding))
    .limit(200)

  const candidates = existing
    .filter((e) => e.embedding)
    .map((e) => ({ id: e.id, title: e.title, embedding: JSON.parse(e.embedding!) as number[] }))

  const similar = findSimilar(embedding, candidates, 0.7)

  return similar.slice(0, 5).map((s) => ({
    id: s.id,
    title: candidates.find((c) => c.id === s.id)?.title ?? '',
    score: s.score,
  }))
}

// ─── Phase 3: Research Sessions ───

export async function createResearchSession(data: {
  participant_id: string
  session_type: string
  topic: string
  notes?: string
  conducted_by?: string
  conducted_at?: string
  recording_url?: string
}) {
  await db.insert(researchSessions).values({
    participant_id: data.participant_id,
    session_type: data.session_type,
    topic: data.topic,
    notes: data.notes || '',
    conducted_by: data.conducted_by || null,
    conducted_at: data.conducted_at ? new Date(data.conducted_at) : null,
    recording_url: data.recording_url || null,
  })

  // Auto-update participant contact info
  await db.update(researchParticipants).set({
    contact_count: sql`COALESCE(${researchParticipants.contact_count}, 0) + 1`,
    last_contacted_at: new Date(),
  }).where(eq(researchParticipants.id, data.participant_id))
}

export async function getResearchSessions(participantId?: string): Promise<ResearchSession[]> {
  const rows = participantId
    ? await db.select().from(researchSessions).where(eq(researchSessions.participant_id, participantId)).orderBy(desc(researchSessions.created_at))
    : await db.select().from(researchSessions).orderBy(desc(researchSessions.created_at))

  return rows.map((r) => ({
    id: r.id,
    participant_id: r.participant_id,
    session_type: r.session_type as SessionType,
    topic: r.topic,
    notes: r.notes ?? '',
    conducted_by: r.conducted_by,
    conducted_at: r.conducted_at,
    recording_url: r.recording_url,
    created_at: r.created_at!,
  }))
}

export async function updateResearchSession(id: string, data: {
  topic?: string
  notes?: string
  conducted_by?: string
  conducted_at?: string
  recording_url?: string
}) {
  const updateData: Record<string, unknown> = {}
  if (data.topic !== undefined) updateData.topic = data.topic
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.conducted_by !== undefined) updateData.conducted_by = data.conducted_by
  if (data.conducted_at !== undefined) updateData.conducted_at = new Date(data.conducted_at)
  if (data.recording_url !== undefined) updateData.recording_url = data.recording_url

  await db.update(researchSessions).set(updateData).where(eq(researchSessions.id, id))
}

export async function deleteResearchSession(id: string) {
  await db.delete(researchSessions).where(eq(researchSessions.id, id))
}

export async function getParticipantWithSessions(id: string) {
  const [participant] = await db.select().from(researchParticipants).where(eq(researchParticipants.id, id))
  if (!participant) return null

  const sessions = await getResearchSessions(id)

  // Get submissions by this participant's email
  const submissions = await db.select().from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.email, participant.email))
    .orderBy(desc(feedbackSubmissions.created_at))

  return {
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      user_type: participant.user_type as UserType,
      source: participant.source,
      tags: participant.tags ?? '[]',
      notes: participant.notes ?? '',
      last_contacted_at: participant.last_contacted_at,
      contact_count: participant.contact_count ?? 0,
      opted_in_at: participant.opted_in_at!,
      created_at: participant.created_at!,
    },
    sessions,
    submissions: submissions.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      created_at: r.created_at!,
    })),
  }
}

// ─── Phase 3: Status Lookup ───

export async function lookupFeedbackByEmail(email: string): Promise<{
  id: string
  title: string
  category: string
  status: string
  created_at: Date
  reviewed_at: Date | null
}[]> {
  if (!email.trim()) return []
  const rows = await db.select({
    id: feedbackSubmissions.id,
    title: feedbackSubmissions.title,
    category: feedbackSubmissions.category,
    status: feedbackSubmissions.status,
    created_at: feedbackSubmissions.created_at,
    reviewed_at: feedbackSubmissions.reviewed_at,
  }).from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.email, email.trim().toLowerCase()))
    .orderBy(desc(feedbackSubmissions.created_at))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    created_at: r.created_at!,
    reviewed_at: r.reviewed_at,
  }))
}

// ─── Phase 3: Status Notifications ───

async function notifyFeedbackStatusChange(id: string) {
  try {
    const [submission] = await db.select().from(feedbackSubmissions).where(eq(feedbackSubmissions.id, id))
    if (!submission || !submission.email) return
    if (submission.status === 'new') return // Don't notify on initial status

    const { sendEmail } = await import('@/lib/email')
    const { feedbackStatusUpdate } = await import('@/lib/voice-email-templates')
    const { subject, html } = feedbackStatusUpdate(
      submission.name,
      submission.title,
      submission.status as FeedbackStatus,
    )
    await sendEmail(submission.email, subject, html)

    await db.update(feedbackSubmissions).set({
      status_notified_at: new Date(),
    }).where(eq(feedbackSubmissions.id, id))
  } catch {
    // Best-effort
  }
}

// ─── Phase 3: Slack Digest Data ───

export async function getVoiceDigestData() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [newCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(feedbackSubmissions)
    .where(sql`${feedbackSubmissions.created_at} >= ${oneWeekAgo}`)

  const [unreviewedCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.status, 'new'))

  const clusters = await db.select().from(feedbackClusters)
    .where(eq(feedbackClusters.status, 'active'))
    .orderBy(desc(feedbackClusters.submission_count))
    .limit(5)

  // Sentiment breakdown from recent submissions
  const recent = await db.select({ ai_triage: feedbackSubmissions.ai_triage })
    .from(feedbackSubmissions)
    .where(sql`${feedbackSubmissions.created_at} >= ${oneWeekAgo}`)

  const sentiments = { positive: 0, neutral: 0, negative: 0 }
  for (const r of recent) {
    try {
      const triage = JSON.parse(r.ai_triage ?? '{}')
      if (triage.sentiment && sentiments.hasOwnProperty(triage.sentiment)) {
        sentiments[triage.sentiment as keyof typeof sentiments]++
      }
    } catch {}
  }

  return {
    newSubmissions: newCount?.count ?? 0,
    unreviewedCount: unreviewedCount?.count ?? 0,
    topClusters: clusters.map((c) => ({ label: c.label, count: c.submission_count ?? 0 })),
    sentiments,
  }
}

// ─── Problem Backlog ───

export async function graduateClusterToBacklog(
  clusterId: string,
  status: 'backlog' | 'watching',
  watchUntil?: string,
): Promise<ProblemBacklogItem | null> {
  const [cluster] = await db.select().from(feedbackClusters).where(eq(feedbackClusters.id, clusterId))
  if (!cluster) return null

  // Count research candidates linked to this cluster
  const clusterSubs = await db.select({ email: feedbackSubmissions.email, research_opt_in: feedbackSubmissions.research_opt_in })
    .from(feedbackSubmissions).where(eq(feedbackSubmissions.cluster_id!, clusterId))
  const researchCount = clusterSubs.filter((s) => s.research_opt_in).length

  // Get a representative quote
  const [topSub] = await db.select({ body: feedbackSubmissions.body })
    .from(feedbackSubmissions).where(eq(feedbackSubmissions.cluster_id!, clusterId))
    .orderBy(desc(feedbackSubmissions.created_at)).limit(1)

  // Generate priority signal via AI
  const prioritySignal = await generatePrioritySignal(
    cluster.label,
    cluster.description ?? '',
    cluster.submission_count ?? 0,
    cluster.theme ?? 'Other',
  )

  const [item] = await db.insert(problemBacklog).values({
    title: cluster.label,
    description: cluster.description ?? '',
    evidence: `${cluster.submission_count ?? 0} user submissions in this cluster`,
    strategic_area: cluster.theme || 'Other',
    status,
    watch_until: watchUntil || null,
    source_cluster_id: clusterId,
    submission_count: cluster.submission_count ?? 0,
    research_candidate_count: researchCount,
    representative_quote: topSub?.body?.slice(0, 200) ?? '',
    priority_signal: prioritySignal,
  }).returning()

  // Update cluster
  await db.update(feedbackClusters).set({
    backlog_item_id: item.id,
    status: status === 'watching' ? 'monitoring' : 'planned',
    updated_at: new Date(),
  }).where(eq(feedbackClusters.id, clusterId))

  await db.insert(activityLog).values({
    action: 'backlog_created',
    entity_type: 'problem_backlog',
    entity_id: item.id,
    metadata: JSON.stringify({ cluster_id: clusterId, status }),
  })

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    evidence: item.evidence ?? '',
    strategic_area: item.strategic_area,
    status: item.status as BacklogStatus,
    watch_until: item.watch_until,
    declined_reason: item.declined_reason ?? '',
    declined_at: item.declined_at,
    promoted_at: item.promoted_at,
    roadmap_initiative_id: item.roadmap_initiative_id,
    source_cluster_id: item.source_cluster_id,
    submission_count: item.submission_count ?? 0,
    research_candidate_count: item.research_candidate_count ?? 0,
    representative_quote: item.representative_quote ?? '',
    pm_notes: item.pm_notes ?? '',
    priority_signal: item.priority_signal ?? '',
    created_at: item.created_at!,
    updated_at: item.updated_at!,
  }
}

async function generatePrioritySignal(
  title: string, description: string, count: number, area: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ''
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: `In one sentence, explain why this problem might be worth prioritising for a restaurant deal subscription app.\nCluster: ${title}\nDescription: ${description}\nSubmissions: ${count} users described this problem\nStrategic area: ${area}\nRespond with only the sentence, no preamble.`,
        }],
      }),
    })
    if (!response.ok) return ''
    const result = await response.json()
    return result.content?.[0]?.text?.trim() ?? ''
  } catch {
    return ''
  }
}

export async function getProblemBacklog(filters?: {
  status?: BacklogStatus
  strategic_area?: string
}): Promise<ProblemBacklogItem[]> {
  const conditions = []
  if (filters?.status) conditions.push(eq(problemBacklog.status, filters.status))
  if (filters?.strategic_area) conditions.push(eq(problemBacklog.strategic_area, filters.strategic_area))

  const rows = conditions.length > 0
    ? await db.select().from(problemBacklog).where(and(...conditions)).orderBy(desc(problemBacklog.submission_count))
    : await db.select().from(problemBacklog).orderBy(desc(problemBacklog.submission_count))

  // Get joined data
  const result: ProblemBacklogItem[] = []
  for (const r of rows) {
    let initiative_title: string | undefined
    let cluster_label: string | undefined

    if (r.roadmap_initiative_id) {
      const [init] = await db.select({ title: initiatives.title }).from(initiatives).where(eq(initiatives.id, r.roadmap_initiative_id))
      initiative_title = init?.title
    }
    if (r.source_cluster_id) {
      const [cl] = await db.select({ label: feedbackClusters.label }).from(feedbackClusters).where(eq(feedbackClusters.id, r.source_cluster_id))
      cluster_label = cl?.label
    }

    result.push({
      id: r.id,
      title: r.title,
      description: r.description,
      evidence: r.evidence ?? '',
      strategic_area: r.strategic_area,
      status: r.status as BacklogStatus,
      watch_until: r.watch_until,
      declined_reason: r.declined_reason ?? '',
      declined_at: r.declined_at,
      promoted_at: r.promoted_at,
      roadmap_initiative_id: r.roadmap_initiative_id,
      source_cluster_id: r.source_cluster_id,
      submission_count: r.submission_count ?? 0,
      research_candidate_count: r.research_candidate_count ?? 0,
      representative_quote: r.representative_quote ?? '',
      pm_notes: r.pm_notes ?? '',
      priority_signal: r.priority_signal ?? '',
      created_at: r.created_at!,
      updated_at: r.updated_at!,
      initiative_title,
      cluster_label,
    })
  }

  return result
}

export async function getBacklogCounts() {
  const all = await db.select({ status: problemBacklog.status }).from(problemBacklog)
  const watching = all.filter((r) => r.status === 'watching').length
  const backlog = all.filter((r) => r.status === 'backlog').length
  const promoted = all.filter((r) => r.status === 'promoted').length
  const declined = all.filter((r) => r.status === 'declined').length
  const watchingDue = await getWatchingItemsDue()
  return { watching, backlog, promoted, declined, watchingDueCount: watchingDue.length }
}

export async function updateBacklogItem(id: string, fields: {
  title?: string
  description?: string
  evidence?: string
  strategic_area?: string
  pm_notes?: string
  watch_until?: string | null
}) {
  await db.update(problemBacklog).set({
    ...fields,
    updated_at: new Date(),
  }).where(eq(problemBacklog.id, id))

  await db.insert(activityLog).values({
    action: 'backlog_updated',
    entity_type: 'problem_backlog',
    entity_id: id,
    metadata: JSON.stringify(fields),
  })
}

export async function setBacklogStatus(id: string, status: BacklogStatus, options?: {
  reason?: string
  watchUntil?: string
}) {
  const updates: Record<string, unknown> = { status, updated_at: new Date() }

  if (status === 'declined') {
    updates.declined_reason = options?.reason ?? ''
    updates.declined_at = new Date()
  } else if (status === 'watching') {
    updates.watch_until = options?.watchUntil ?? null
  } else if (status === 'backlog') {
    updates.watch_until = null
  }

  await db.update(problemBacklog).set(updates).where(eq(problemBacklog.id, id))

  await db.insert(activityLog).values({
    action: `backlog_${status}`,
    entity_type: 'problem_backlog',
    entity_id: id,
    metadata: JSON.stringify({ status, ...options }),
  })
}

export async function promoteBacklogToRoadmap(
  id: string,
  column: string,
  criterion: string,
  strategicLevelId: string,
) {
  const [item] = await db.select().from(problemBacklog).where(eq(problemBacklog.id, id))
  if (!item) return null

  // Get max position in target column
  const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` })
    .from(initiatives).where(eq(initiatives.column, column))

  const [newInitiative] = await db.insert(initiatives).values({
    title: item.title,
    subtitle: item.description,
    criterion,
    strategic_level_id: strategicLevelId,
    column,
    position: (maxPos?.max ?? 0) + 1,
    dep_note: `Source: Voice feedback — ${item.submission_count} user submissions`,
  }).returning()

  // Update backlog item
  await db.update(problemBacklog).set({
    status: 'promoted',
    promoted_at: new Date(),
    roadmap_initiative_id: newInitiative.id,
    updated_at: new Date(),
  }).where(eq(problemBacklog.id, id))

  // Update linked cluster if exists
  if (item.source_cluster_id) {
    await db.update(feedbackClusters).set({
      status: 'planned',
      linked_initiative_id: newInitiative.id,
      updated_at: new Date(),
    }).where(eq(feedbackClusters.id, item.source_cluster_id))
  }

  await db.insert(activityLog).values({
    action: 'backlog_promoted',
    entity_type: 'problem_backlog',
    entity_id: id,
    metadata: JSON.stringify({ initiative_id: newInitiative.id, column, criterion }),
  })

  return newInitiative
}

export async function declineBacklogItem(id: string, reason: string) {
  await setBacklogStatus(id, 'declined', { reason })
}

export async function getWatchingItemsDue(): Promise<ProblemBacklogItem[]> {
  const today = new Date().toISOString().split('T')[0]
  const rows = await db.select().from(problemBacklog)
    .where(and(
      eq(problemBacklog.status, 'watching'),
      lte(problemBacklog.watch_until, today),
    ))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    evidence: r.evidence ?? '',
    strategic_area: r.strategic_area,
    status: r.status as BacklogStatus,
    watch_until: r.watch_until,
    declined_reason: r.declined_reason ?? '',
    declined_at: r.declined_at,
    promoted_at: r.promoted_at,
    roadmap_initiative_id: r.roadmap_initiative_id,
    source_cluster_id: r.source_cluster_id,
    submission_count: r.submission_count ?? 0,
    research_candidate_count: r.research_candidate_count ?? 0,
    representative_quote: r.representative_quote ?? '',
    pm_notes: r.pm_notes ?? '',
    priority_signal: r.priority_signal ?? '',
    created_at: r.created_at!,
    updated_at: r.updated_at!,
  }))
}

// ─── Strategic Levels (for promote modal) ───

export async function getStrategicLevelsForSelect() {
  const rows = await db.select({ id: strategicLevels.id, name: strategicLevels.name })
    .from(strategicLevels).orderBy(asc(strategicLevels.position))
  return rows
}

// ─── Agent Run Log ───

export async function getAgentRunHistory(): Promise<AgentRunLogEntry[]> {
  const rows = await db.select().from(agentRunLog).orderBy(desc(agentRunLog.created_at)).limit(30)
  return rows.map((r) => ({
    id: r.id,
    run_date: r.run_date,
    report: r.report,
    slack_posted: r.slack_posted ?? false,
    created_at: r.created_at!,
  }))
}

// ─── Manual Agent Trigger ───

export async function triggerAgentManually() {
  const { runFeedbackAgent } = await import('@/lib/feedback-agent')
  return runFeedbackAgent()
}

// ─── Trend Stats ───

export async function getFeedbackTrendData() {
  const now = new Date()
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)

  // Weekly submission counts by strategic area (using cluster theme)
  const weeklyRows = await db.select({
    week: sql<string>`to_char(date_trunc('week', ${feedbackSubmissions.created_at}), 'IYYY-IW')`,
    cluster_id: feedbackSubmissions.cluster_id,
    count: sql<number>`count(*)::int`,
  }).from(feedbackSubmissions)
    .where(gte(feedbackSubmissions.created_at, twelveWeeksAgo))
    .groupBy(sql`date_trunc('week', ${feedbackSubmissions.created_at})`, feedbackSubmissions.cluster_id)

  // Map cluster_id to strategic area
  const clusterMap = new Map<string, string>()
  const allClusters = await db.select({ id: feedbackClusters.id, theme: feedbackClusters.theme })
    .from(feedbackClusters)
  for (const c of allClusters) clusterMap.set(c.id, c.theme || 'Other')

  // Build weekly by area
  const weeklyByArea: Record<string, Record<string, number>> = {}
  for (const row of weeklyRows) {
    if (!weeklyByArea[row.week]) weeklyByArea[row.week] = { Discovery: 0, Churn: 0, 'Trial conversion': 0, Partner: 0, Other: 0 }
    const area = row.cluster_id ? (clusterMap.get(row.cluster_id) || 'Other') : 'Other'
    const normalizedArea = ['Discovery', 'Churn', 'Trial conversion', 'Partner'].includes(area) ? area : 'Other'
    weeklyByArea[row.week][normalizedArea] += row.count
  }

  const weeks = Object.keys(weeklyByArea).sort()
  const weeklyByAreaArr = weeks.map((w) => ({ week: w, ...weeklyByArea[w] }))

  // Cluster velocity — top clusters by total submissions
  const topClusters = await db.select().from(feedbackClusters)
    .orderBy(desc(feedbackClusters.submission_count))
    .limit(10)

  const clusterVelocity = []
  for (const cluster of topClusters) {
    const weeklyData = await db.select({
      week: sql<string>`to_char(date_trunc('week', ${feedbackSubmissions.created_at}), 'IYYY-IW')`,
      count: sql<number>`count(*)::int`,
    }).from(feedbackSubmissions)
      .where(and(
        eq(feedbackSubmissions.cluster_id!, cluster.id),
        gte(feedbackSubmissions.created_at, twelveWeeksAgo),
      ))
      .groupBy(sql`date_trunc('week', ${feedbackSubmissions.created_at})`)

    const weeklyCounts = weeks.map((w) => ({
      week: w,
      count: weeklyData.find((d) => d.week === w)?.count ?? 0,
    }))

    const lastFour = weeklyCounts.slice(-4)
    const prevFour = weeklyCounts.slice(-8, -4)
    const lastSum = lastFour.reduce((s, w) => s + w.count, 0)
    const prevSum = prevFour.reduce((s, w) => s + w.count, 0)
    const trend = lastSum > prevSum * 1.2 ? 'growing' as const
      : lastSum < prevSum * 0.8 ? 'declining' as const
      : 'stable' as const

    clusterVelocity.push({
      clusterId: cluster.id,
      clusterTitle: cluster.label,
      weeklyCounts,
      trend,
    })
  }

  // Quality distribution over time
  const qualityRows = await db.select({
    week: sql<string>`to_char(date_trunc('week', ${feedbackSubmissions.created_at}), 'IYYY-IW')`,
    ai_triage: feedbackSubmissions.ai_triage,
  }).from(feedbackSubmissions)
    .where(and(
      gte(feedbackSubmissions.created_at, twelveWeeksAgo),
      isNotNull(feedbackSubmissions.ai_triage),
    ))

  const qualityByWeek: Record<string, { total: number; sum: number }> = {}
  for (const row of qualityRows) {
    try {
      const triage = JSON.parse(row.ai_triage ?? '{}')
      if (triage.quality_score) {
        if (!qualityByWeek[row.week]) qualityByWeek[row.week] = { total: 0, sum: 0 }
        qualityByWeek[row.week].total++
        qualityByWeek[row.week].sum += triage.quality_score
      }
    } catch {}
  }

  const qualityOverTime = weeks.map((w) => ({
    week: w,
    avgScore: qualityByWeek[w] ? Math.round((qualityByWeek[w].sum / qualityByWeek[w].total) * 10) / 10 : 0,
    total: qualityByWeek[w]?.total ?? 0,
  }))

  // System health
  const [totalSubs] = await db.select({ count: sql<number>`count(*)::int` }).from(feedbackSubmissions)
  const [totalClusters] = await db.select({ count: sql<number>`count(*)::int` }).from(feedbackClusters)
  const [openClusters] = await db.select({ count: sql<number>`count(*)::int` }).from(feedbackClusters)
    .where(eq(feedbackClusters.status, 'active'))
  const [backlogCount] = await db.select({ count: sql<number>`count(*)::int` }).from(problemBacklog)
  const [promotedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(problemBacklog)
    .where(eq(problemBacklog.status, 'promoted'))
  const [respondedClusters] = await db.select({ count: sql<number>`count(*)::int` })
    .from(feedbackClusters)
    .where(isNotNull(feedbackClusters.backlog_item_id))

  const totalClusterCount = totalClusters?.count ?? 0
  const respondedCount = respondedClusters?.count ?? 0
  const responseRate = totalClusterCount > 0 ? Math.round((respondedCount / totalClusterCount) * 100) : 0

  // Backlog flow (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [graduatedLast30] = await db.select({ count: sql<number>`count(*)::int` })
    .from(problemBacklog).where(gte(problemBacklog.created_at, thirtyDaysAgo))
  const [promotedLast30] = await db.select({ count: sql<number>`count(*)::int` })
    .from(problemBacklog).where(and(eq(problemBacklog.status, 'promoted'), gte(problemBacklog.promoted_at, thirtyDaysAgo)))
  const [declinedLast30] = await db.select({ count: sql<number>`count(*)::int` })
    .from(problemBacklog).where(and(eq(problemBacklog.status, 'declined'), gte(problemBacklog.declined_at, thirtyDaysAgo)))
  const [currentlyWatching] = await db.select({ count: sql<number>`count(*)::int` })
    .from(problemBacklog).where(eq(problemBacklog.status, 'watching'))
  const [currentlyBacklog] = await db.select({ count: sql<number>`count(*)::int` })
    .from(problemBacklog).where(eq(problemBacklog.status, 'backlog'))

  // Research candidate count
  const [researchCount] = await db.select({ count: sql<number>`count(*)::int` }).from(researchParticipants)

  return {
    weeklyByArea: weeklyByAreaArr,
    clusterVelocity,
    qualityOverTime,
    health: {
      totalSubmissions: totalSubs?.count ?? 0,
      totalClusters: totalClusterCount,
      openClusters: openClusters?.count ?? 0,
      responseRate,
      backlogItems: backlogCount?.count ?? 0,
      promotedToRoadmap: promotedCount?.count ?? 0,
      researchCandidates: researchCount?.count ?? 0,
    },
    backlogFlow: {
      graduated_last_30: graduatedLast30?.count ?? 0,
      promoted_last_30: promotedLast30?.count ?? 0,
      declined_last_30: declinedLast30?.count ?? 0,
      currently_watching: currentlyWatching?.count ?? 0,
      currently_backlog: currentlyBacklog?.count ?? 0,
    },
  }
}
