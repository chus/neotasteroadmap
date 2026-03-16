import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS confidence_problem integer`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS confidence_solution integer`

  console.log('Added confidence_problem and confidence_solution columns')
}

main().catch(console.error)
