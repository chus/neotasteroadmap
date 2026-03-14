import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  console.log('Creating strategic_levels table...')
  await sql`
    CREATE TABLE IF NOT EXISTS strategic_levels (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL UNIQUE,
      color text NOT NULL,
      description text DEFAULT '',
      position integer DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `

  console.log('Seeding strategic levels...')
  const levels = [
    { name: 'Discovery', color: '#378ADD', position: 0 },
    { name: 'Trial conversion', color: '#7F77DD', position: 1 },
    { name: 'Churn', color: '#D85A30', position: 2 },
    { name: 'Partner', color: '#1D9E75', position: 3 },
  ]

  for (const level of levels) {
    await sql`
      INSERT INTO strategic_levels (name, color, position)
      VALUES (${level.name}, ${level.color}, ${level.position})
      ON CONFLICT (name) DO NOTHING
    `
  }

  console.log('Adding criterion_secondary column...')
  await sql`
    ALTER TABLE initiatives
    ADD COLUMN IF NOT EXISTS criterion_secondary text
  `

  console.log('Adding strategic_level_id column...')
  await sql`
    ALTER TABLE initiatives
    ADD COLUMN IF NOT EXISTS strategic_level_id uuid REFERENCES strategic_levels(id)
  `

  console.log('Migrating track values to strategic_level_id...')
  // Map old track values to strategic level IDs
  const trackMapping: Record<string, string> = {
    discovery: 'Discovery',
    conversion: 'Trial conversion',
    churn: 'Churn',
    partner: 'Partner',
  }

  for (const [trackValue, levelName] of Object.entries(trackMapping)) {
    await sql`
      UPDATE initiatives
      SET strategic_level_id = (SELECT id FROM strategic_levels WHERE name = ${levelName})
      WHERE track = ${trackValue} AND strategic_level_id IS NULL
    `
  }

  console.log('Verifying migration...')
  const unmigrated = await sql`
    SELECT count(*) as cnt FROM initiatives WHERE strategic_level_id IS NULL
  `
  console.log(`Unmigrated rows: ${unmigrated[0].cnt}`)

  // Optionally drop the old track column (keeping it for safety)
  // await sql`ALTER TABLE initiatives DROP COLUMN IF EXISTS track`

  console.log('Done!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
