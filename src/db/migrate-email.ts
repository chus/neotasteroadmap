import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding submitter_email column to feature_requests…')
  await sql`ALTER TABLE feature_requests ADD COLUMN IF NOT EXISTS submitter_email TEXT DEFAULT ''`
  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
