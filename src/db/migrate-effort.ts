import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding effort column to initiatives…')
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS effort TEXT DEFAULT NULL`
  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
