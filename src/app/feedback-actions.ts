'use server'

import { db } from '@/db'
import { feedbackSubmissions, researchParticipants, activityLog, initiatives, feedbackClusters, researchSessions } from '@/db/schema'
import { eq, desc, sql, asc, and, ilike, isNull, isNotNull } from 'drizzle-orm'
import type { FeedbackSubmission, FeedbackStatus, FeedbackCategory, UserType, ResearchParticipant, FeedbackCluster, ClusterStatus, ResearchSession, SessionType } from '@/types'

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
