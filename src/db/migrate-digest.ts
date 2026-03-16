import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS digest_subscribers (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email text NOT NULL UNIQUE,
      name text DEFAULT '',
      is_active boolean DEFAULT true,
      subscribed_at timestamp DEFAULT now()
    )
  `

  console.log('Created digest_subscribers table')
}

main().catch(console.error)
