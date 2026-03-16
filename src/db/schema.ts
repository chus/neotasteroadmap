import { pgTable, uuid, text, integer, timestamp, unique, boolean } from 'drizzle-orm/pg-core'

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
  effort: text('effort'),
  target_month: text('target_month'),
  is_public: boolean('is_public').notNull().default(false),
  is_parent: boolean('is_parent').notNull().default(false),
  parent_initiative_id: uuid('parent_initiative_id'),
  parent_color: text('parent_color'),
  phase: text('phase'),
  linear_project_id: text('linear_project_id'),
  linear_url: text('linear_url'),
  linear_state: text('linear_state'),
  linear_synced_at: timestamp('linear_synced_at'),
  linear_sync_enabled: boolean('linear_sync_enabled').notNull().default(false),
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
  submitter_email: text('submitter_email').default(''),
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

export const requestComments = pgTable('request_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  request_id: uuid('request_id').notNull().references(() => featureRequests.id, { onDelete: 'cascade' }),
  parent_id: uuid('parent_id'),
  author_name: text('author_name').notNull(),
  author_role: text('author_role').default(''),
  body: text('body').notNull(),
  is_team_response: boolean('is_team_response').default(false),
  created_at: timestamp('created_at').defaultNow(),
})

export const linearSyncLog = pgTable('linear_sync_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  initiative_id: uuid('initiative_id').notNull().references(() => initiatives.id, { onDelete: 'cascade' }),
  initiative_title: text('initiative_title').notNull(),
  direction: text('direction').notNull(),
  status: text('status').notNull(),
  linear_project_id: text('linear_project_id'),
  changes: text('changes'),
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow(),
})

export const keyAccounts = pgTable('key_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  company: text('company').default(''),
  logo_url: text('logo_url').default(''),
  position: integer('position').default(0),
  created_at: timestamp('created_at').defaultNow(),
})

export const keyAccountInitiatives = pgTable('key_account_initiatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  key_account_id: uuid('key_account_id').notNull().references(() => keyAccounts.id, { onDelete: 'cascade' }),
  initiative_id: uuid('initiative_id').notNull().references(() => initiatives.id, { onDelete: 'cascade' }),
  note: text('note').default(''),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('kai_account_initiative_unique').on(table.key_account_id, table.initiative_id),
])

export const initiativeReactions = pgTable('initiative_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  initiative_id: uuid('initiative_id').notNull().references(() => initiatives.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(),
  reactor_fingerprint: text('reactor_fingerprint').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  unique('ir_initiative_emoji_fingerprint').on(table.initiative_id, table.emoji, table.reactor_fingerprint),
])

export const activityLog = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: uuid('entity_id'),
  metadata: text('metadata').default('{}'),
  created_at: timestamp('created_at').defaultNow(),
})
