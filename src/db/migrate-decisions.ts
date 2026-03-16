import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS decision_log (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      decision text NOT NULL,
      rationale text NOT NULL,
      made_by text NOT NULL,
      decided_at date NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `

  console.log('Created decision_log table')
}

main().catch(console.error)
