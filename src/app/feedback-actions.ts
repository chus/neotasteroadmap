'use server'

import { db } from '@/db'
import { feedbackSubmissions, researchParticipants, activityLog, initiatives, strategicLevels } from '@/db/schema'
import { eq, desc, sql, asc, and, ilike } from 'drizzle-orm'
import type { FeedbackSubmission, FeedbackStatus, FeedbackCategory, UserType, ResearchParticipant } from '@/types'

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
