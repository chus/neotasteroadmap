'use server'

import { db } from '@/db'
import { initiatives, strategicLevels, featureRequests, votes, requestComments, activityLog, linearSyncLog, keyAccounts, keyAccountInitiatives, initiativeReactions, digestSubscribers, decisionLog } from '@/db/schema'
import { eq, asc, desc, sql, isNull, ilike, or, inArray, and } from 'drizzle-orm'
import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { getFingerprint } from '@/lib/fingerprint'
import type { Initiative, StrategicLevel, Column, FeatureRequest, RequestStatus, Criterion, Phase, RequestComment, LinearSyncLogEntry, KeyAccount, KeyAccountInitiative, ReactionCount, DigestSubscriber, DecisionEntry } from '@/types'

// ─── Initiatives ───

export async function getInitiatives(): Promise<Initiative[]> {
  const parentAlias = db.$with('parent_alias').as(
    db.select({ id: initiatives.id, title: initiatives.title, parent_color: initiatives.parent_color }).from(initiatives).where(eq(initiatives.is_parent, true))
  )

  const rows = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      subtitle: initiatives.subtitle,
      strategic_level_id: initiatives.strategic_level_id,
      criterion: initiatives.criterion,
      criterion_secondary: initiatives.criterion_secondary,
      column: initiatives.column,
      position: initiatives.position,
      dep_note: initiatives.dep_note,
      effort: initiatives.effort,
      target_month: initiatives.target_month,
      is_public: initiatives.is_public,
      is_parent: initiatives.is_parent,
      parent_initiative_id: initiatives.parent_initiative_id,
      parent_color: initiatives.parent_color,
      phase: initiatives.phase,
      confidence_problem: initiatives.confidence_problem,
      confidence_solution: initiatives.confidence_solution,
      linear_project_id: initiatives.linear_project_id,
      linear_url: initiatives.linear_url,
      linear_state: initiatives.linear_state,
      linear_synced_at: initiatives.linear_synced_at,
      linear_sync_enabled: initiatives.linear_sync_enabled,
      created_at: initiatives.created_at,
      level_name: strategicLevels.name,
      level_color: strategicLevels.color,
    })
    .from(initiatives)
    .leftJoin(strategicLevels, eq(initiatives.strategic_level_id, strategicLevels.id))
    .orderBy(asc(initiatives.column), asc(initiatives.position))

  // Build parent title map
  const parentIds = [...new Set(rows.filter((r) => r.parent_initiative_id).map((r) => r.parent_initiative_id!))]
  const parentMap = new Map<string, { title: string; color: string | null }>()
  for (const r of rows) {
    if (parentIds.includes(r.id)) {
      parentMap.set(r.id, { title: r.title, color: r.parent_color })
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? '',
    strategic_level_id: r.strategic_level_id,
    strategic_level_name: r.level_name ?? '',
    strategic_level_color: r.level_color ?? '#999',
    criterion: r.criterion as Criterion,
    criterion_secondary: (r.criterion_secondary as Criterion) ?? null,
    column: r.column as Column,
    position: r.position,
    dep_note: r.dep_note ?? '',
    effort: r.effort ?? null,
    target_month: r.target_month ?? null,
    is_public: r.is_public ?? false,
    is_parent: r.is_parent ?? false,
    parent_initiative_id: r.parent_initiative_id ?? null,
    parent_color: r.parent_color ?? null,
    parent_title: r.parent_initiative_id ? parentMap.get(r.parent_initiative_id)?.title : undefined,
    phase: (r.phase as Phase) ?? null,
    confidence_problem: r.confidence_problem ?? null,
    confidence_solution: r.confidence_solution ?? null,
    linear_project_id: r.linear_project_id ?? null,
    linear_url: r.linear_url ?? null,
    linear_state: r.linear_state ?? null,
    linear_synced_at: r.linear_synced_at ?? null,
    linear_sync_enabled: r.linear_sync_enabled ?? false,
    created_at: r.created_at ?? new Date(),
  }))
}

export async function updateInitiativeColumn(
  id: string,
  column: Column,
  position: number
) {
  await db
    .update(initiatives)
    .set({ column, position })
    .where(eq(initiatives.id, id))
}

export async function updatePositions(
  updates: { id: string; position: number }[]
) {
  await Promise.all(
    updates.map((u) =>
      db
        .update(initiatives)
        .set({ position: u.position })
        .where(eq(initiatives.id, u.id))
    )
  )
}

export async function updateInitiative(
  id: string,
  fields: {
    title?: string
    subtitle?: string
    strategic_level_id?: string | null
    criterion?: string
    criterion_secondary?: string | null
    column?: string
    dep_note?: string
    effort?: string | null
    target_month?: string | null
    is_public?: boolean
    is_parent?: boolean
    parent_initiative_id?: string | null
    parent_color?: string | null
    phase?: string | null
    confidence_problem?: number | null
    confidence_solution?: number | null
  }
) {
  await db.update(initiatives).set(fields).where(eq(initiatives.id, id))
}

export async function createInitiative(data: {
  title: string
  subtitle?: string
  strategic_level_id?: string | null
  criterion: string
  criterion_secondary?: string | null
  column: string
  position: number
  dep_note?: string
  effort?: string | null
  target_month?: string | null
  is_parent?: boolean
  parent_initiative_id?: string | null
  parent_color?: string | null
  phase?: string | null
}): Promise<Initiative> {
  const [row] = await db.insert(initiatives).values(data).returning()

  // Fetch the level info
  let levelName = ''
  let levelColor = '#999'
  if (row.strategic_level_id) {
    const [level] = await db
      .select()
      .from(strategicLevels)
      .where(eq(strategicLevels.id, row.strategic_level_id))
    if (level) {
      levelName = level.name
      levelColor = level.color
    }
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    strategic_level_id: row.strategic_level_id,
    strategic_level_name: levelName,
    strategic_level_color: levelColor,
    criterion: row.criterion as Criterion,
    criterion_secondary: (row.criterion_secondary as Criterion) ?? null,
    column: row.column as Column,
    position: row.position,
    dep_note: row.dep_note ?? '',
    effort: row.effort ?? null,
    target_month: row.target_month ?? null,
    is_public: row.is_public ?? false,
    is_parent: row.is_parent ?? false,
    parent_initiative_id: row.parent_initiative_id ?? null,
    parent_color: row.parent_color ?? null,
    phase: (row.phase as Phase) ?? null,
    confidence_problem: row.confidence_problem ?? null,
    confidence_solution: row.confidence_solution ?? null,
    linear_project_id: row.linear_project_id ?? null,
    linear_url: row.linear_url ?? null,
    linear_state: row.linear_state ?? null,
    linear_synced_at: row.linear_synced_at ?? null,
    linear_sync_enabled: row.linear_sync_enabled ?? false,
    created_at: row.created_at ?? new Date(),
  }
}

export async function deleteInitiative(id: string) {
  await db.delete(initiatives).where(eq(initiatives.id, id))
}

export async function getPublicInitiatives(): Promise<Initiative[]> {
  const rows = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      subtitle: initiatives.subtitle,
      strategic_level_id: initiatives.strategic_level_id,
      criterion: initiatives.criterion,
      criterion_secondary: initiatives.criterion_secondary,
      column: initiatives.column,
      position: initiatives.position,
      dep_note: initiatives.dep_note,
      effort: initiatives.effort,
      target_month: initiatives.target_month,
      is_public: initiatives.is_public,
      is_parent: initiatives.is_parent,
      parent_initiative_id: initiatives.parent_initiative_id,
      parent_color: initiatives.parent_color,
      phase: initiatives.phase,
      confidence_problem: initiatives.confidence_problem,
      confidence_solution: initiatives.confidence_solution,
      linear_project_id: initiatives.linear_project_id,
      linear_url: initiatives.linear_url,
      linear_state: initiatives.linear_state,
      linear_synced_at: initiatives.linear_synced_at,
      linear_sync_enabled: initiatives.linear_sync_enabled,
      created_at: initiatives.created_at,
      level_name: strategicLevels.name,
      level_color: strategicLevels.color,
    })
    .from(initiatives)
    .leftJoin(strategicLevels, eq(initiatives.strategic_level_id, strategicLevels.id))
    .where(eq(initiatives.is_public, true))
    .orderBy(asc(initiatives.column), asc(initiatives.position))

  const parentIds = [...new Set(rows.filter((r) => r.parent_initiative_id).map((r) => r.parent_initiative_id!))]
  const parentMap = new Map<string, string>()
  for (const r of rows) {
    if (parentIds.includes(r.id)) parentMap.set(r.id, r.title)
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? '',
    strategic_level_id: r.strategic_level_id,
    strategic_level_name: r.level_name ?? '',
    strategic_level_color: r.level_color ?? '#999',
    criterion: r.criterion as Criterion,
    criterion_secondary: (r.criterion_secondary as Criterion) ?? null,
    column: r.column as Column,
    position: r.position,
    dep_note: r.dep_note ?? '',
    effort: r.effort ?? null,
    target_month: r.target_month ?? null,
    is_public: true,
    is_parent: r.is_parent ?? false,
    parent_initiative_id: r.parent_initiative_id ?? null,
    parent_color: r.parent_color ?? null,
    parent_title: r.parent_initiative_id ? parentMap.get(r.parent_initiative_id) : undefined,
    phase: (r.phase as Phase) ?? null,
    confidence_problem: r.confidence_problem ?? null,
    confidence_solution: r.confidence_solution ?? null,
    linear_project_id: r.linear_project_id ?? null,
    linear_url: r.linear_url ?? null,
    linear_state: r.linear_state ?? null,
    linear_synced_at: r.linear_synced_at ?? null,
    linear_sync_enabled: r.linear_sync_enabled ?? false,
    created_at: r.created_at ?? new Date(),
  }))
}

// ─── Strategic Levels ───

export async function getStrategicLevels(): Promise<StrategicLevel[]> {
  const rows = await db
    .select()
    .from(strategicLevels)
    .orderBy(asc(strategicLevels.position))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    description: r.description ?? '',
    position: r.position ?? 0,
    created_at: r.created_at ?? new Date(),
  }))
}

export async function createStrategicLevel(
  name: string,
  color: string,
  description: string
): Promise<StrategicLevel> {
  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${strategicLevels.position}), -1)` })
    .from(strategicLevels)

  const [row] = await db
    .insert(strategicLevels)
    .values({ name, color, description, position: (maxPos[0]?.max ?? -1) + 1 })
    .returning()

  return {
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description ?? '',
    position: row.position ?? 0,
    created_at: row.created_at ?? new Date(),
  }
}

export async function updateStrategicLevel(
  id: string,
  fields: Partial<Pick<StrategicLevel, 'name' | 'color' | 'description' | 'position'>>
) {
  await db.update(strategicLevels).set(fields).where(eq(strategicLevels.id, id))
}

export async function deleteStrategicLevel(
  id: string
): Promise<{ error?: string }> {
  const refs = await db
    .select({ count: sql<number>`count(*)` })
    .from(initiatives)
    .where(eq(initiatives.strategic_level_id, id))

  if (refs[0].count > 0) {
    return { error: 'Remove initiatives from this level first' }
  }

  await db.delete(strategicLevels).where(eq(strategicLevels.id, id))
  return {}
}

export async function updateStrategicLevelPositions(
  updates: { id: string; position: number }[]
) {
  await Promise.all(
    updates.map((u) =>
      db
        .update(strategicLevels)
        .set({ position: u.position })
        .where(eq(strategicLevels.id, u.id))
    )
  )
}

// ─── Feature Requests ───

function mapFeatureRequest(r: typeof featureRequests.$inferSelect): FeatureRequest {
  return {
    id: r.id,
    title: r.title,
    customer_problem: r.customer_problem,
    current_behaviour: r.current_behaviour,
    desired_outcome: r.desired_outcome,
    success_metric: r.success_metric,
    customer_evidence: r.customer_evidence,
    submitter_name: r.submitter_name,
    submitter_role: r.submitter_role ?? '',
    submitter_email: r.submitter_email ?? '',
    status: (r.status ?? 'open') as RequestStatus,
    admin_note: r.admin_note ?? '',
    ai_triage: r.ai_triage ?? null,
    roadmap_initiative_id: r.roadmap_initiative_id,
    vote_count: r.vote_count ?? 0,
    created_at: r.created_at ?? new Date(),
  }
}

export async function getFeatureRequests(status?: string): Promise<FeatureRequest[]> {
  let query = db
    .select()
    .from(featureRequests)
    .orderBy(desc(featureRequests.vote_count), desc(featureRequests.created_at))

  if (status) {
    query = query.where(eq(featureRequests.status, status)) as typeof query
  }

  const rows = await query
  return rows.map(mapFeatureRequest)
}

export async function createFeatureRequest(data: {
  title: string
  customer_problem: string
  current_behaviour: string
  desired_outcome: string
  success_metric: string
  customer_evidence: string
  submitter_name: string
  submitter_role?: string
  submitter_email?: string
}): Promise<FeatureRequest> {
  const [row] = await db.insert(featureRequests).values(data).returning()
  // Fire-and-forget AI triage
  triageFeatureRequest(row.id).catch(() => {})
  return mapFeatureRequest(row)
}

export async function voteOnRequest(requestId: string): Promise<{ alreadyVoted: boolean }> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? 'unknown'
  const userAgent = hdrs.get('user-agent') ?? 'unknown'
  const fingerprint = createHash('sha256').update(ip + userAgent).digest('hex')

  try {
    await db.insert(votes).values({ request_id: requestId, voter_fingerprint: fingerprint })
    await db
      .update(featureRequests)
      .set({ vote_count: sql`${featureRequests.vote_count} + 1` })
      .where(eq(featureRequests.id, requestId))

    // Check vote thresholds for email notification
    const [updated] = await db.select().from(featureRequests).where(eq(featureRequests.id, requestId))
    if (updated && updated.submitter_email && [10, 25, 50].includes(updated.vote_count ?? 0)) {
      const { sendEmail } = await import('@/lib/email')
      const { voteThreshold } = await import('@/lib/email-templates')
      const mapped = mapFeatureRequest(updated)
      const { subject, html } = voteThreshold(mapped, updated.vote_count ?? 0)
      await sendEmail(updated.submitter_email, subject, html)
    }

    return { alreadyVoted: false }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('unique') || message.includes('duplicate') || message.includes('violates')) {
      return { alreadyVoted: true }
    }
    throw err
  }
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  adminNote?: string
) {
  const fields: Record<string, unknown> = { status }
  if (adminNote !== undefined) fields.admin_note = adminNote
  await db.update(featureRequests).set(fields).where(eq(featureRequests.id, id))

  // Send email notification
  const [request] = await db.select().from(featureRequests).where(eq(featureRequests.id, id))
  if (request && request.submitter_email) {
    const { sendEmail } = await import('@/lib/email')
    const { statusChanged } = await import('@/lib/email-templates')
    const mapped = mapFeatureRequest(request)
    const { subject, html } = statusChanged(mapped, status)
    await sendEmail(request.submitter_email, subject, html)
  }
}

export async function promoteToRoadmap(
  requestId: string,
  column: Column,
  criterion: string,
  strategicLevelId: string
) {
  const [request] = await db
    .select()
    .from(featureRequests)
    .where(eq(featureRequests.id, requestId))

  if (!request) throw new Error('Request not found')

  const colItems = await db
    .select()
    .from(initiatives)
    .where(eq(initiatives.column, column))

  const [newInit] = await db
    .insert(initiatives)
    .values({
      title: request.title,
      subtitle: request.customer_problem,
      strategic_level_id: strategicLevelId,
      criterion,
      column,
      position: colItems.length,
    })
    .returning()

  await db
    .update(featureRequests)
    .set({ status: 'promoted', roadmap_initiative_id: newInit.id })
    .where(eq(featureRequests.id, requestId))

  return newInit.id
}

export async function getLinkedRequest(initiativeId: string): Promise<FeatureRequest | null> {
  const [row] = await db
    .select()
    .from(featureRequests)
    .where(eq(featureRequests.roadmap_initiative_id, initiativeId))

  return row ? mapFeatureRequest(row) : null
}

export async function searchFeatureRequests(query: string): Promise<{ id: string; title: string; vote_count: number; status: string }[]> {
  if (!query || query.length < 3) return []
  const pattern = `%${query}%`
  const rows = await db
    .select({
      id: featureRequests.id,
      title: featureRequests.title,
      vote_count: featureRequests.vote_count,
      status: featureRequests.status,
    })
    .from(featureRequests)
    .where(or(ilike(featureRequests.title, pattern), ilike(featureRequests.customer_problem, pattern)))
    .limit(5)
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    vote_count: r.vote_count ?? 0,
    status: r.status ?? 'open',
  }))
}

// ─── Comments ───

function mapComment(r: typeof requestComments.$inferSelect): RequestComment {
  return {
    id: r.id,
    request_id: r.request_id,
    parent_id: r.parent_id,
    author_name: r.author_name,
    author_role: r.author_role ?? '',
    body: r.body,
    is_team_response: r.is_team_response ?? false,
    created_at: r.created_at ?? new Date(),
  }
}

export async function getComments(requestId: string): Promise<RequestComment[]> {
  const rows = await db
    .select()
    .from(requestComments)
    .where(eq(requestComments.request_id, requestId))
    .orderBy(asc(requestComments.created_at))

  const mapped = rows.map(mapComment)

  // Nest replies under parents
  const topLevel: RequestComment[] = []
  const replyMap = new Map<string, RequestComment[]>()

  for (const c of mapped) {
    if (c.parent_id) {
      const existing = replyMap.get(c.parent_id) ?? []
      existing.push(c)
      replyMap.set(c.parent_id, existing)
    } else {
      topLevel.push(c)
    }
  }

  return topLevel.map((c) => ({
    ...c,
    replies: replyMap.get(c.id) ?? [],
  }))
}

export async function getCommentCount(requestId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(requestComments)
    .where(eq(requestComments.request_id, requestId))
  return Number(result.count)
}

export async function getCommentCounts(requestIds: string[]): Promise<Record<string, number>> {
  if (requestIds.length === 0) return {}
  const rows = await db
    .select({
      request_id: requestComments.request_id,
      count: sql<number>`count(*)`,
    })
    .from(requestComments)
    .groupBy(requestComments.request_id)
  const counts: Record<string, number> = {}
  for (const r of rows) {
    counts[r.request_id] = Number(r.count)
  }
  return counts
}

export async function createComment(
  requestId: string,
  authorName: string,
  authorRole: string,
  body: string,
  parentId?: string,
  isTeamResponse?: boolean
): Promise<RequestComment> {
  const [row] = await db
    .insert(requestComments)
    .values({
      request_id: requestId,
      parent_id: parentId ?? null,
      author_name: authorName,
      author_role: authorRole,
      body,
      is_team_response: isTeamResponse ?? false,
    })
    .returning()

  // Log to activity_log
  const action = isTeamResponse ? 'team_responded' : 'commented'
  await db.insert(activityLog).values({
    action,
    entity_type: 'feature_request',
    entity_id: requestId,
    metadata: JSON.stringify({ comment_id: row.id, author_name: authorName }),
  })

  return mapComment(row)
}

export async function deleteComment(id: string) {
  // Delete replies first, then the comment
  await db.delete(requestComments).where(eq(requestComments.parent_id, id))
  await db.delete(requestComments).where(eq(requestComments.id, id))
}

// ─── Linear Integration ───

export async function pushToLinear(initiativeId: string): Promise<{ success: boolean; linearUrl?: string; error?: string }> {
  const { isLinearConfigured, getLinearTeam, createLinearProject, updateLinearProject, COLUMN_TO_LINEAR_STATE } = await import('@/lib/linear')

  if (!isLinearConfigured()) {
    return { success: false, error: 'Linear not configured' }
  }

  try {
    const [row] = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.id, initiativeId))

    if (!row) return { success: false, error: 'Initiative not found' }

    const team = await getLinearTeam()
    const state = COLUMN_TO_LINEAR_STATE[row.column] ?? 'planned'
    const description = [row.subtitle, row.dep_note ? `Dependency: ${row.dep_note}` : ''].filter(Boolean).join('\n\n')
    const targetDate = row.target_month ? `${row.target_month}-01` : undefined

    let projectId = row.linear_project_id
    let projectUrl = row.linear_url

    if (!projectId) {
      const project = await createLinearProject({
        name: row.title,
        description,
        teamIds: [team.id],
        state,
        targetDate,
      })
      projectId = project.id
      projectUrl = project.url
    } else {
      const project = await updateLinearProject(projectId, {
        name: row.title,
        description,
        state,
        targetDate: targetDate ?? null,
      })
      projectUrl = project.url
    }

    const now = new Date()
    await db
      .update(initiatives)
      .set({
        linear_project_id: projectId,
        linear_url: projectUrl,
        linear_state: state,
        linear_synced_at: now,
        linear_sync_enabled: true,
      })
      .where(eq(initiatives.id, initiativeId))

    await db.insert(linearSyncLog).values({
      initiative_id: initiativeId,
      initiative_title: row.title,
      direction: 'push',
      status: 'success',
      linear_project_id: projectId,
      changes: JSON.stringify({ state, targetDate: targetDate ?? null }),
    })

    return { success: true, linearUrl: projectUrl ?? undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Try to log the failure
    try {
      await db.insert(linearSyncLog).values({
        initiative_id: initiativeId,
        initiative_title: '',
        direction: 'push',
        status: 'failed',
        error_message: message,
      })
    } catch { /* ignore logging failure */ }

    return { success: false, error: message }
  }
}

export async function pullFromLinear(initiativeId: string): Promise<{ success: boolean; changes?: string; error?: string }> {
  const { isLinearConfigured, getLinearProject, LINEAR_STATE_TO_COLUMN } = await import('@/lib/linear')

  if (!isLinearConfigured()) {
    return { success: false, error: 'Linear not configured' }
  }

  try {
    const [row] = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.id, initiativeId))

    if (!row) return { success: false, error: 'Initiative not found' }
    if (!row.linear_project_id) return { success: false, error: 'Not linked to Linear' }

    const project = await getLinearProject(row.linear_project_id)
    const changesList: string[] = []
    const updates: Record<string, unknown> = {}

    // Check column
    const mappedColumn = LINEAR_STATE_TO_COLUMN[project.state]
    if (mappedColumn && mappedColumn !== row.column) {
      changesList.push(`Column: ${row.column} → ${mappedColumn}`)
      updates.column = mappedColumn
    }

    // Check target month
    const linearMonth = project.targetDate ? project.targetDate.substring(0, 7) : null
    if (linearMonth !== row.target_month) {
      changesList.push(`Target month: ${row.target_month ?? 'none'} → ${linearMonth ?? 'none'}`)
      updates.target_month = linearMonth
    }

    if (Object.keys(updates).length > 0) {
      await db.update(initiatives).set(updates).where(eq(initiatives.id, initiativeId))

      if (updates.column) {
        await db.insert(activityLog).values({
          action: 'moved',
          entity_type: 'initiative',
          entity_id: initiativeId,
          metadata: JSON.stringify({ note: 'synced from Linear', from: row.column, to: updates.column }),
        })
      }
    }

    const now = new Date()
    await db
      .update(initiatives)
      .set({
        linear_state: project.state,
        linear_synced_at: now,
      })
      .where(eq(initiatives.id, initiativeId))

    const changesText = changesList.length > 0 ? changesList.join('; ') : 'No changes'

    await db.insert(linearSyncLog).values({
      initiative_id: initiativeId,
      initiative_title: row.title,
      direction: 'pull',
      status: 'success',
      linear_project_id: row.linear_project_id,
      changes: changesText,
    })

    return { success: true, changes: changesText }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    try {
      await db.insert(linearSyncLog).values({
        initiative_id: initiativeId,
        initiative_title: '',
        direction: 'pull',
        status: 'failed',
        error_message: message,
      })
    } catch { /* ignore */ }

    return { success: false, error: message }
  }
}

export async function unlinkFromLinear(initiativeId: string): Promise<{ success: boolean }> {
  await db
    .update(initiatives)
    .set({
      linear_project_id: null,
      linear_url: null,
      linear_state: null,
      linear_synced_at: null,
      linear_sync_enabled: false,
    })
    .where(eq(initiatives.id, initiativeId))

  await db.insert(activityLog).values({
    action: 'unlinked',
    entity_type: 'initiative',
    entity_id: initiativeId,
    metadata: JSON.stringify({ note: 'Unlinked from Linear' }),
  })

  return { success: true }
}

export async function importFromLinear(
  linearProjectId: string,
  column: Column,
  criterion: Criterion,
  strategicLevelId: string
): Promise<Initiative> {
  const { getLinearProject } = await import('@/lib/linear')

  const project = await getLinearProject(linearProjectId)

  const colItems = await db
    .select()
    .from(initiatives)
    .where(eq(initiatives.column, column))

  const targetMonth = project.targetDate ? project.targetDate.substring(0, 7) : null

  const [row] = await db
    .insert(initiatives)
    .values({
      title: project.name,
      subtitle: project.description ?? '',
      strategic_level_id: strategicLevelId,
      criterion,
      column,
      position: colItems.length,
      target_month: targetMonth,
      linear_project_id: project.id,
      linear_url: project.url,
      linear_state: project.state,
      linear_synced_at: new Date(),
      linear_sync_enabled: true,
    })
    .returning()

  let levelName = ''
  let levelColor = '#999'
  if (strategicLevelId) {
    const [level] = await db
      .select()
      .from(strategicLevels)
      .where(eq(strategicLevels.id, strategicLevelId))
    if (level) {
      levelName = level.name
      levelColor = level.color
    }
  }

  await db.insert(activityLog).values({
    action: 'created',
    entity_type: 'initiative',
    entity_id: row.id,
    metadata: JSON.stringify({ note: 'imported from Linear', linear_project_id: project.id }),
  })

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    strategic_level_id: row.strategic_level_id,
    strategic_level_name: levelName,
    strategic_level_color: levelColor,
    criterion: row.criterion as Criterion,
    criterion_secondary: (row.criterion_secondary as Criterion) ?? null,
    column: row.column as Column,
    position: row.position,
    dep_note: row.dep_note ?? '',
    effort: row.effort ?? null,
    target_month: row.target_month ?? null,
    is_public: row.is_public ?? false,
    is_parent: false,
    parent_initiative_id: null,
    parent_color: null,
    phase: null,
    confidence_problem: null,
    confidence_solution: null,
    linear_project_id: row.linear_project_id ?? null,
    linear_url: row.linear_url ?? null,
    linear_state: row.linear_state ?? null,
    linear_synced_at: row.linear_synced_at ?? null,
    linear_sync_enabled: row.linear_sync_enabled ?? false,
    created_at: row.created_at ?? new Date(),
  }
}

export async function getLinearSyncLog(initiativeId: string, limit = 10): Promise<LinearSyncLogEntry[]> {
  const rows = await db
    .select()
    .from(linearSyncLog)
    .where(eq(linearSyncLog.initiative_id, initiativeId))
    .orderBy(desc(linearSyncLog.created_at))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    initiative_id: r.initiative_id,
    initiative_title: r.initiative_title,
    direction: r.direction as 'push' | 'pull',
    status: r.status as 'success' | 'failed',
    linear_project_id: r.linear_project_id,
    changes: r.changes,
    error_message: r.error_message,
    created_at: r.created_at ?? new Date(),
  }))
}

export async function getAllLinearSyncLogs(limit = 20, offset = 0): Promise<LinearSyncLogEntry[]> {
  const rows = await db
    .select()
    .from(linearSyncLog)
    .orderBy(desc(linearSyncLog.created_at))
    .limit(limit)
    .offset(offset)

  return rows.map((r) => ({
    id: r.id,
    initiative_id: r.initiative_id,
    initiative_title: r.initiative_title,
    direction: r.direction as 'push' | 'pull',
    status: r.status as 'success' | 'failed',
    linear_project_id: r.linear_project_id,
    changes: r.changes,
    error_message: r.error_message,
    created_at: r.created_at ?? new Date(),
  }))
}

export async function getLinearProjects(): Promise<{ id: string; name: string; state: string; url: string; targetDate: string | null; description: string | null }[]> {
  const { isLinearConfigured, getLinearTeam, getLinearProjectStates } = await import('@/lib/linear')

  if (!isLinearConfigured()) return []

  try {
    const team = await getLinearTeam()
    return await getLinearProjectStates(team.id)
  } catch {
    return []
  }
}

export async function testLinearConnection(): Promise<{ success: boolean; teamName?: string; error?: string }> {
  const { isLinearConfigured, getLinearTeam } = await import('@/lib/linear')

  if (!isLinearConfigured()) {
    return { success: false, error: 'LINEAR_API_KEY not set' }
  }

  try {
    const team = await getLinearTeam()
    return { success: true, teamName: team.name }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

// ─── Parent Initiatives ───

export async function getParentInitiatives(): Promise<Initiative[]> {
  const all = await getInitiatives()
  return all.filter((i) => i.is_parent)
}

export async function getChildInitiatives(parentId: string): Promise<Initiative[]> {
  const all = await getInitiatives()
  return all.filter((i) => i.parent_initiative_id === parentId)
}

export async function setParent(childId: string, parentId: string | null) {
  await db.update(initiatives).set({ parent_initiative_id: parentId }).where(eq(initiatives.id, childId))
}

// ─── Key Accounts ───

export async function getKeyAccounts(): Promise<KeyAccount[]> {
  const rows = await db
    .select()
    .from(keyAccounts)
    .orderBy(asc(keyAccounts.position))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company ?? '',
    logo_url: r.logo_url ?? '',
    position: r.position ?? 0,
    created_at: r.created_at ?? new Date(),
  }))
}

export async function createKeyAccount(data: {
  name: string
  company?: string
  logo_url?: string
}): Promise<KeyAccount> {
  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${keyAccounts.position}), -1)` })
    .from(keyAccounts)

  const [row] = await db
    .insert(keyAccounts)
    .values({ ...data, position: (maxPos[0]?.max ?? -1) + 1 })
    .returning()

  return {
    id: row.id,
    name: row.name,
    company: row.company ?? '',
    logo_url: row.logo_url ?? '',
    position: row.position ?? 0,
    created_at: row.created_at ?? new Date(),
  }
}

export async function updateKeyAccount(id: string, fields: { name?: string; company?: string; logo_url?: string }) {
  await db.update(keyAccounts).set(fields).where(eq(keyAccounts.id, id))
}

export async function deleteKeyAccount(id: string) {
  await db.delete(keyAccounts).where(eq(keyAccounts.id, id))
}

export async function updateKeyAccountPositions(updates: { id: string; position: number }[]) {
  await Promise.all(
    updates.map((u) =>
      db.update(keyAccounts).set({ position: u.position }).where(eq(keyAccounts.id, u.id))
    )
  )
}

// ─── Key Account <-> Initiative linking ───

export async function getKeyAccountInitiatives(keyAccountId: string): Promise<KeyAccountInitiative[]> {
  const rows = await db
    .select()
    .from(keyAccountInitiatives)
    .where(eq(keyAccountInitiatives.key_account_id, keyAccountId))
    .orderBy(asc(keyAccountInitiatives.created_at))

  return rows.map((r) => ({
    id: r.id,
    key_account_id: r.key_account_id,
    initiative_id: r.initiative_id,
    note: r.note ?? '',
    created_at: r.created_at ?? new Date(),
  }))
}

export async function getInitiativeKeyAccounts(initiativeId: string): Promise<KeyAccount[]> {
  const links = await db
    .select({ key_account_id: keyAccountInitiatives.key_account_id })
    .from(keyAccountInitiatives)
    .where(eq(keyAccountInitiatives.initiative_id, initiativeId))

  if (links.length === 0) return []

  const ids = links.map((l) => l.key_account_id)
  const accounts = await getKeyAccounts()
  return accounts.filter((a) => ids.includes(a.id))
}

export async function linkKeyAccountInitiative(keyAccountId: string, initiativeId: string, note?: string) {
  await db.insert(keyAccountInitiatives).values({
    key_account_id: keyAccountId,
    initiative_id: initiativeId,
    note: note ?? '',
  }).onConflictDoNothing()
}

export async function unlinkKeyAccountInitiative(keyAccountId: string, initiativeId: string) {
  await db.delete(keyAccountInitiatives)
    .where(
      sql`${keyAccountInitiatives.key_account_id} = ${keyAccountId} AND ${keyAccountInitiatives.initiative_id} = ${initiativeId}`
    )
}

export async function getAllKeyAccountLinks(): Promise<KeyAccountInitiative[]> {
  const rows = await db
    .select()
    .from(keyAccountInitiatives)
    .orderBy(asc(keyAccountInitiatives.created_at))

  return rows.map((r) => ({
    id: r.id,
    key_account_id: r.key_account_id,
    initiative_id: r.initiative_id,
    note: r.note ?? '',
    created_at: r.created_at ?? new Date(),
  }))
}

// ─── Reactions ───

const REACTION_EMOJIS = ['👍', '🔥', '😬', '🤔', '❤️']

export async function getReactionsForInitiative(initiativeId: string): Promise<ReactionCount[]> {
  const fingerprint = await getFingerprint()

  const rows = await db
    .select({
      emoji: initiativeReactions.emoji,
      count: sql<number>`count(*)`,
    })
    .from(initiativeReactions)
    .where(eq(initiativeReactions.initiative_id, initiativeId))
    .groupBy(initiativeReactions.emoji)

  const myReactions = await db
    .select({ emoji: initiativeReactions.emoji })
    .from(initiativeReactions)
    .where(
      and(
        eq(initiativeReactions.initiative_id, initiativeId),
        eq(initiativeReactions.reactor_fingerprint, fingerprint)
      )
    )
  const mySet = new Set(myReactions.map((r) => r.emoji))
  const countMap = new Map(rows.map((r) => [r.emoji, Number(r.count)]))

  return REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: countMap.get(emoji) ?? 0,
    reacted: mySet.has(emoji),
  }))
}

export async function getReactionsForInitiatives(initiativeIds: string[]): Promise<Record<string, ReactionCount[]>> {
  if (initiativeIds.length === 0) return {}

  const fingerprint = await getFingerprint()

  const rows = await db
    .select({
      initiative_id: initiativeReactions.initiative_id,
      emoji: initiativeReactions.emoji,
      count: sql<number>`count(*)`,
    })
    .from(initiativeReactions)
    .where(inArray(initiativeReactions.initiative_id, initiativeIds))
    .groupBy(initiativeReactions.initiative_id, initiativeReactions.emoji)

  const myReactions = await db
    .select({
      initiative_id: initiativeReactions.initiative_id,
      emoji: initiativeReactions.emoji,
    })
    .from(initiativeReactions)
    .where(
      and(
        inArray(initiativeReactions.initiative_id, initiativeIds),
        eq(initiativeReactions.reactor_fingerprint, fingerprint)
      )
    )

  const mySet = new Set(myReactions.map((r) => `${r.initiative_id}:${r.emoji}`))

  // Build map
  const countMap = new Map<string, Map<string, number>>()
  for (const r of rows) {
    if (!countMap.has(r.initiative_id)) countMap.set(r.initiative_id, new Map())
    countMap.get(r.initiative_id)!.set(r.emoji, Number(r.count))
  }

  const result: Record<string, ReactionCount[]> = {}
  for (const id of initiativeIds) {
    const emojiCounts = countMap.get(id)
    result[id] = REACTION_EMOJIS.map((emoji) => ({
      emoji,
      count: emojiCounts?.get(emoji) ?? 0,
      reacted: mySet.has(`${id}:${emoji}`),
    }))
  }
  return result
}

export async function toggleReaction(initiativeId: string, emoji: string): Promise<ReactionCount[]> {
  if (!REACTION_EMOJIS.includes(emoji)) throw new Error('Invalid emoji')

  const fingerprint = await getFingerprint()

  // Check if reaction exists
  const [existing] = await db
    .select({ id: initiativeReactions.id })
    .from(initiativeReactions)
    .where(
      and(
        eq(initiativeReactions.initiative_id, initiativeId),
        eq(initiativeReactions.emoji, emoji),
        eq(initiativeReactions.reactor_fingerprint, fingerprint)
      )
    )

  if (existing) {
    await db.delete(initiativeReactions).where(eq(initiativeReactions.id, existing.id))
  } else {
    try {
      await db.insert(initiativeReactions).values({
        initiative_id: initiativeId,
        emoji,
        reactor_fingerprint: fingerprint,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('unique') || message.includes('duplicate') || message.includes('violates')) {
        // Already reacted — ignore
      } else {
        throw err
      }
    }
  }

  return getReactionsForInitiative(initiativeId)
}

// ─── Digest Subscribers ───

export async function subscribeToDigest(email: string, name?: string): Promise<{ success: boolean; alreadySubscribed: boolean }> {
  const normalized = email.toLowerCase().trim()
  const [existing] = await db
    .select()
    .from(digestSubscribers)
    .where(eq(digestSubscribers.email, normalized))

  if (existing) {
    if (existing.is_active) {
      return { success: true, alreadySubscribed: true }
    }
    // Reactivate
    await db.update(digestSubscribers).set({ is_active: true, name: name ?? existing.name }).where(eq(digestSubscribers.id, existing.id))
    return { success: true, alreadySubscribed: false }
  }

  await db.insert(digestSubscribers).values({ email: normalized, name: name ?? '' })
  return { success: true, alreadySubscribed: false }
}

export async function unsubscribeFromDigest(email: string) {
  const normalized = email.toLowerCase().trim()
  await db.update(digestSubscribers).set({ is_active: false }).where(eq(digestSubscribers.email, normalized))
}

export async function getDigestSubscribers(): Promise<DigestSubscriber[]> {
  const rows = await db
    .select()
    .from(digestSubscribers)
    .where(eq(digestSubscribers.is_active, true))
    .orderBy(asc(digestSubscribers.subscribed_at))

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? '',
    is_active: r.is_active ?? true,
    subscribed_at: r.subscribed_at ?? new Date(),
  }))
}

export async function getAllDigestSubscribers(): Promise<DigestSubscriber[]> {
  const rows = await db
    .select()
    .from(digestSubscribers)
    .orderBy(asc(digestSubscribers.subscribed_at))

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? '',
    is_active: r.is_active ?? true,
    subscribed_at: r.subscribed_at ?? new Date(),
  }))
}

export async function deleteDigestSubscriber(id: string) {
  await db.delete(digestSubscribers).where(eq(digestSubscribers.id, id))
}

export async function toggleDigestSubscriber(id: string, isActive: boolean) {
  await db.update(digestSubscribers).set({ is_active: isActive }).where(eq(digestSubscribers.id, id))
}

export async function getWeeklyDigestData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Initiatives moved in last 7 days
  const moveRows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.action, 'moved'),
        eq(activityLog.entity_type, 'initiative'),
        sql`${activityLog.created_at} > ${sevenDaysAgo}`
      )
    )
    .orderBy(desc(activityLog.created_at))

  // All current initiatives for counts
  const allInitiatives = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      column: initiatives.column,
    })
    .from(initiatives)

  const columnCounts: Record<string, number> = { now: 0, next: 0, later: 0, parked: 0 }
  for (const i of allInitiatives) {
    if (columnCounts[i.column] !== undefined) columnCounts[i.column]++
  }

  // Build initiative title map
  const titleMap = new Map(allInitiatives.map((i) => [i.id, i.title]))

  // Parse moves
  const moves = moveRows.map((r) => {
    const meta = JSON.parse(r.metadata ?? '{}')
    return {
      title: titleMap.get(r.entity_id ?? '') ?? 'Unknown',
      from: meta.from ?? '?',
      to: meta.to ?? '?',
    }
  })

  // New feature requests in last 7 days
  const newRequests = await db
    .select()
    .from(featureRequests)
    .where(sql`${featureRequests.created_at} > ${sevenDaysAgo}`)
    .orderBy(desc(featureRequests.vote_count))

  // Feature requests with status changes (from activity_log)
  const statusChanges = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.entity_type, 'feature_request'),
        sql`${activityLog.created_at} > ${sevenDaysAgo}`
      )
    )

  return {
    moves,
    columnCounts,
    newRequestCount: newRequests.length,
    topRequests: newRequests.slice(0, 3).map((r) => ({
      title: r.title,
      vote_count: r.vote_count ?? 0,
      status: r.status ?? 'open',
    })),
    statusChangeCount: statusChanges.length,
  }
}

// ─── Decision Log ───

function mapDecisionEntry(r: typeof decisionLog.$inferSelect): DecisionEntry {
  return {
    id: r.id,
    initiative_id: r.initiative_id,
    decision: r.decision,
    rationale: r.rationale,
    made_by: r.made_by,
    decided_at: r.decided_at,
    created_at: r.created_at ?? new Date(),
  }
}

export async function getDecisionLog(initiativeId: string): Promise<DecisionEntry[]> {
  const rows = await db
    .select()
    .from(decisionLog)
    .where(eq(decisionLog.initiative_id, initiativeId))
    .orderBy(desc(decisionLog.decided_at))
  return rows.map(mapDecisionEntry)
}

export async function createDecisionEntry(
  initiativeId: string,
  data: { decision: string; rationale: string; made_by: string; decided_at: string }
): Promise<DecisionEntry> {
  const [row] = await db
    .insert(decisionLog)
    .values({ initiative_id: initiativeId, ...data })
    .returning()

  await db.insert(activityLog).values({
    action: 'updated',
    entity_type: 'initiative',
    entity_id: initiativeId,
    metadata: JSON.stringify({ field_changed: 'decision_log', value_after: data.decision }),
  })

  return mapDecisionEntry(row)
}

export async function updateDecisionEntry(
  id: string,
  data: { decision?: string; rationale?: string; made_by?: string; decided_at?: string }
) {
  await db.update(decisionLog).set(data).where(eq(decisionLog.id, id))
}

export async function deleteDecisionEntry(id: string) {
  await db.delete(decisionLog).where(eq(decisionLog.id, id))
}

// ─── AI Triage ───

export async function triageFeatureRequest(requestId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const [request] = await db.select().from(featureRequests).where(eq(featureRequests.id, requestId))
  if (!request) return

  // Get strategic levels and existing initiatives for context
  const levels = await db.select().from(strategicLevels).orderBy(asc(strategicLevels.position))
  const existingInitiatives = await db.select({ id: initiatives.id, title: initiatives.title, column: initiatives.column, criterion: initiatives.criterion }).from(initiatives).orderBy(asc(initiatives.position))

  const levelNames = levels.map((l) => l.name).join(', ')
  const initiativeList = existingInitiatives.map((i) => `- "${i.title}" (${i.column}, ${i.criterion})`).join('\n')

  const prompt = `You are a product triage assistant. Analyze this feature request and return a JSON object with your assessment.

Feature request:
- Title: ${request.title}
- Customer problem: ${request.customer_problem}
- Current behaviour: ${request.current_behaviour}
- Desired outcome: ${request.desired_outcome}
- Success metric: ${request.success_metric}
- Customer evidence: ${request.customer_evidence}
- Submitter: ${request.submitter_name}${request.submitter_role ? ` (${request.submitter_role})` : ''}

Available strategic levels: ${levelNames || 'None defined'}
Available criteria: execution_ready (scoped and ready), foundation (infrastructure/tooling), dependency (external team), research (needs investigation), parked (deprioritized)
Available columns: now (Q1-Q2), next (Q2-Q3), later (Q3-Q4), parked (out of scope 2026)

Existing roadmap initiatives:
${initiativeList || 'None yet'}

Return ONLY a valid JSON object (no markdown, no code fences) with these fields:
{
  "suggested_strategic_level": "name of the best-fit strategic level or null",
  "suggested_criterion": "one of: execution_ready, foundation, dependency, research, parked",
  "suggested_column": "one of: now, next, later, parked",
  "evidence_quality": "strong | moderate | weak",
  "evidence_note": "one sentence explaining the evidence quality assessment",
  "duplicate_risk": "high | medium | low | none",
  "duplicate_of": "title of the most similar existing initiative, or null",
  "summary": "one sentence summary of what this request is about",
  "recommendation": "one sentence recommendation for the product team"
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

    await db.update(featureRequests).set({ ai_triage: text }).where(eq(featureRequests.id, requestId))
  } catch {
    // Silently fail — triage is best-effort
  }
}

export async function dismissTriage(requestId: string) {
  await db.update(featureRequests).set({ ai_triage: null }).where(eq(featureRequests.id, requestId))
}

export async function applyTriageSuggestions(requestId: string) {
  const [request] = await db.select().from(featureRequests).where(eq(featureRequests.id, requestId))
  if (!request?.ai_triage) return null

  try {
    const triage = JSON.parse(request.ai_triage)
    const { suggested_strategic_level, suggested_criterion, suggested_column } = triage

    // Find strategic level by name
    let strategicLevelId: string | null = null
    if (suggested_strategic_level) {
      const [level] = await db.select().from(strategicLevels).where(ilike(strategicLevels.name, suggested_strategic_level))
      if (level) strategicLevelId = level.id
    }

    // Create initiative from the request
    const criterion = suggested_criterion || 'research'
    const column = suggested_column || 'later'

    const [initiative] = await db.insert(initiatives).values({
      title: request.title,
      subtitle: request.customer_problem.slice(0, 120),
      strategic_level_id: strategicLevelId,
      criterion,
      column,
      position: 0,
      dep_note: `From feature request by ${request.submitter_name}`,
    }).returning()

    // Update request status to promoted
    await db.update(featureRequests).set({
      status: 'promoted',
      roadmap_initiative_id: initiative.id,
    }).where(eq(featureRequests.id, requestId))

    return { initiativeId: initiative.id }
  } catch {
    return null
  }
}
