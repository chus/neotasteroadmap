import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS released_at TIMESTAMP`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS release_note TEXT`

  console.log('Done — released_at and release_note columns added to initiatives')
}

main().catch(console.error)
