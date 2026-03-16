import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`ALTER TABLE feature_requests ADD COLUMN IF NOT EXISTS ai_triage TEXT`

  console.log('Done — ai_triage column added to feature_requests')
}

main().catch(console.error)
