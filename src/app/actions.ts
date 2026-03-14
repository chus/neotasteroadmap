'use server'

import { db } from '@/db'
import { initiatives } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import type { Initiative, Column } from '@/types'

export async function getInitiatives(): Promise<Initiative[]> {
  const rows = await db
    .select()
    .from(initiatives)
    .orderBy(asc(initiatives.column), asc(initiatives.position))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? '',
    track: r.track as Initiative['track'],
    criterion: r.criterion as Initiative['criterion'],
    column: r.column as Initiative['column'],
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
  fields: Partial<Pick<Initiative, 'title' | 'subtitle' | 'track' | 'criterion' | 'dep_note'>>
) {
  await db.update(initiatives).set(fields).where(eq(initiatives.id, id))
}

export async function createInitiative(data: {
  title: string
  subtitle?: string
  track: string
  criterion: string
  column: string
  position: number
  dep_note?: string
}) {
  const [row] = await db.insert(initiatives).values(data).returning()
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    track: row.track as Initiative['track'],
    criterion: row.criterion as Initiative['criterion'],
    column: row.column as Initiative['column'],
    position: row.position,
    dep_note: row.dep_note ?? '',
    created_at: row.created_at ?? new Date(),
  }
}

export async function deleteInitiative(id: string) {
  await db.delete(initiatives).where(eq(initiatives.id, id))
}
