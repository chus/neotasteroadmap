import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Adding target_month column to initiatives…')
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS target_month text`

  console.log('Done.')
}

migrate().catch(console.error)
