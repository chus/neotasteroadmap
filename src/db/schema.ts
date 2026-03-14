import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const initiatives = pgTable('initiatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  track: text('track').notNull(),
  criterion: text('criterion').notNull(),
  column: text('column').notNull(),
  position: integer('position').notNull().default(0),
  dep_note: text('dep_note').default(''),
  created_at: timestamp('created_at').defaultNow(),
})
