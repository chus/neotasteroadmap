import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Adding Linear columns to initiatives…')
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_project_id text`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_url text`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_state text`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_synced_at timestamp`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_sync_enabled boolean NOT NULL DEFAULT false`

  console.log('Creating linear_sync_log table…')
  await sql`CREATE TABLE IF NOT EXISTS linear_sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    initiative_title text NOT NULL,
    direction text NOT NULL,
    status text NOT NULL,
    linear_project_id text,
    changes text,
    error_message text,
    created_at timestamp DEFAULT now()
  )`

  console.log('Done.')
}

migrate().catch(console.error)
