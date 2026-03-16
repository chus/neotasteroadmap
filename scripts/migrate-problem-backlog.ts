import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Running problem backlog migration...')

  await sql`
    CREATE TABLE IF NOT EXISTS problem_backlog (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT DEFAULT '',
      strategic_area TEXT NOT NULL,
      status TEXT DEFAULT 'backlog',
      watch_until DATE,
      declined_reason TEXT DEFAULT '',
      declined_at TIMESTAMP,
      promoted_at TIMESTAMP,
      roadmap_initiative_id UUID REFERENCES initiatives(id),
      source_cluster_id UUID REFERENCES feedback_clusters(id),
      submission_count INTEGER DEFAULT 0,
      research_candidate_count INTEGER DEFAULT 0,
      representative_quote TEXT DEFAULT '',
      pm_notes TEXT DEFAULT '',
      priority_signal TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    )
  `
  console.log('Created problem_backlog table')

  await sql`
    ALTER TABLE feedback_clusters
    ADD COLUMN IF NOT EXISTS backlog_item_id UUID REFERENCES problem_backlog(id)
  `
  console.log('Added backlog_item_id to feedback_clusters')

  // Agent run log for Prompt B
  await sql`
    CREATE TABLE IF NOT EXISTS agent_run_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      run_date DATE NOT NULL,
      report TEXT NOT NULL,
      slack_posted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now()
    )
  `
  console.log('Created agent_run_log table')

  console.log('Migration complete.')
}

main().catch(console.error)
