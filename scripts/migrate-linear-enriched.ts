import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Prompt 1 — enriched Linear fields
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_progress INTEGER`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_issue_count INTEGER`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_completed_issue_count INTEGER`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_in_progress_issue_count INTEGER`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_lead TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_members TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_start_date TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_target_date TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_updates TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS linear_milestone TEXT`

  // Prompt 2 — drift detection fields
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS sync_status TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS sync_drift TEXT`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS sync_drift_detected_at TIMESTAMP`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS sync_dismissed_at TIMESTAMP`

  console.log('Done — 14 enriched Linear + drift columns added to initiatives')
}

main().catch(console.error)
