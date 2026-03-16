import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  console.log('Running Voice Phase 2 migration...')

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_clusters (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT DEFAULT '',
      theme TEXT DEFAULT '',
      submission_count INTEGER DEFAULT 0,
      avg_sentiment TEXT,
      top_urgency TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      linked_initiative_id UUID REFERENCES initiatives(id),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    )
  `
  console.log('Created feedback_clusters table')

  await sql`ALTER TABLE feedback_submissions ADD COLUMN IF NOT EXISTS embedding TEXT`
  await sql`ALTER TABLE feedback_submissions ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES feedback_clusters(id)`
  console.log('Added embedding and cluster_id columns to feedback_submissions')

  console.log('Voice Phase 2 migration complete.')
}

main().catch(console.error)
