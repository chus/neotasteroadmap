import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  console.log('Running Voice Phase 1 migration...')

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'consumer',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      restaurant_name TEXT,
      order_context TEXT,
      device TEXT,
      app_version TEXT,
      ai_triage TEXT,
      ai_triaged_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'new',
      internal_note TEXT DEFAULT '',
      actioned_initiative_id UUID REFERENCES initiatives(id),
      research_opt_in BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      reviewed_at TIMESTAMP,
      reviewed_by TEXT
    )
  `
  console.log('Created feedback_submissions table')

  await sql`
    CREATE TABLE IF NOT EXISTS research_participants (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      user_type TEXT NOT NULL DEFAULT 'consumer',
      source TEXT NOT NULL DEFAULT 'voice_form',
      tags TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      last_contacted_at TIMESTAMP,
      contact_count INTEGER DEFAULT 0,
      opted_in_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now()
    )
  `
  console.log('Created research_participants table')

  console.log('Voice Phase 1 migration complete.')
}

main().catch(console.error)
