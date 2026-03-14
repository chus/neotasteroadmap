import { pgTable, uuid, text, integer, timestamp, unique } from 'drizzle-orm/pg-core'

export const strategicLevels = pgTable('strategic_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  description: text('description').default(''),
  position: integer('position').default(0),
  created_at: timestamp('created_at').defaultNow(),
})

export const initiatives = pgTable('initiatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  strategic_level_id: uuid('strategic_level_id').references(() => strategicLevels.id),
  criterion: text('criterion').notNull(),
  criterion_secondary: text('criterion_secondary'),
  column: text('column').notNull(),
  position: integer('position').notNull().default(0),
  dep_note: text('dep_note').default(''),
  created_at: timestamp('created_at').defaultNow(),
})

export const featureRequests = pgTable('feature_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  customer_problem: text('customer_problem').notNull(),
  current_behaviour: text('current_behaviour').notNull(),
  desired_outcome: text('desired_outcome').notNull(),
  success_metric: text('success_metric').notNull(),
  customer_evidence: text('customer_evidence').notNull(),
  submitter_name: text('submitter_name').notNull(),
  submitter_role: text('submitter_role').default(''),
  status: text('status').default('open'),
  admin_note: text('admin_note').default(''),
  roadmap_initiative_id: uuid('roadmap_initiative_id').references(() => initiatives.id),
  vote_count: integer('vote_count').default(0),
  created_at: timestamp('created_at').defaultNow(),
})

export const votes = pgTable('votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  request_id: uuid('request_id').notNull().references(() => featureRequests.id),
  voter_fingerprint: text('voter_fingerprint').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('votes_request_fingerprint_unique').on(table.request_id, table.voter_fingerprint),
])
