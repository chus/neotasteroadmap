import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  console.log('Running Voice Phase 3 migration...')

  await sql`
    CREATE TABLE IF NOT EXISTS research_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      participant_id UUID NOT NULL REFERENCES research_participants(id) ON DELETE CASCADE,
      session_type TEXT NOT NULL DEFAULT 'interview',
      topic TEXT NOT NULL,
      notes TEXT DEFAULT '',
      conducted_by TEXT,
      conducted_at TIMESTAMP,
      recording_url TEXT,
      created_at TIMESTAMP DEFAULT now()
    )
  `
  console.log('Created research_sessions table')

  await sql`ALTER TABLE feedback_submissions ADD COLUMN IF NOT EXISTS status_notified_at TIMESTAMP`
  console.log('Added status_notified_at column to feedback_submissions')

  console.log('Voice Phase 3 migration complete.')
}

main().catch(console.error)
