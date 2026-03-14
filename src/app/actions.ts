'use server'

import { db } from '@/db'
import { initiatives, strategicLevels, featureRequests, votes } from '@/db/schema'
import { eq, asc, desc, sql } from 'drizzle-orm'
import { createHash } from 'crypto'
import { headers } from 'next/headers'
import type { Initiative, StrategicLevel, Column, FeatureRequest, RequestStatus, Criterion } from '@/types'

// ─── Initiatives ───

export async function getInitiatives(): Promise<Initiative[]> {
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
      created_at: initiatives.created_at,
      level_name: strategicLevels.name,
      level_color: strategicLevels.color,
    })
    .from(initiatives)
    .leftJoin(strategicLevels, eq(initiatives.strategic_level_id, strategicLevels.id))
    .orderBy(asc(initiatives.column), asc(initiatives.position))

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
    created_at: row.created_at ?? new Date(),
  }
}

export async function deleteInitiative(id: string) {
  await db.delete(initiatives).where(eq(initiatives.id, id))
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
    status: (r.status ?? 'open') as RequestStatus,
    admin_note: r.admin_note ?? '',
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
}): Promise<FeatureRequest> {
  const [row] = await db.insert(featureRequests).values(data).returning()
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
