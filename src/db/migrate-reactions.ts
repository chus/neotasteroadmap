import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS initiative_reactions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      emoji text NOT NULL,
      reactor_fingerprint text NOT NULL,
      created_at timestamp DEFAULT now(),
      CONSTRAINT ir_initiative_emoji_fingerprint UNIQUE (initiative_id, emoji, reactor_fingerprint)
    )
  `

  console.log('Created initiative_reactions table')
}

main().catch(console.error)
