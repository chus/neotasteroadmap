import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating request_comments table…')
  await sql`
    CREATE TABLE IF NOT EXISTS request_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
      parent_id UUID,
      author_name TEXT NOT NULL,
      author_role TEXT DEFAULT '',
      body TEXT NOT NULL,
      is_team_response BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now()
    )
  `

  console.log('Creating activity_log table…')
  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id UUID,
      metadata TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT now()
    )
  `

  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
