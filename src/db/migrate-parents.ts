import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Add parent-related columns to initiatives
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS is_parent boolean NOT NULL DEFAULT false`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS parent_initiative_id uuid`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS parent_color text`
  await sql`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS phase text`

  console.log('✓ Added is_parent, parent_initiative_id, parent_color, phase to initiatives')

  // Create key_accounts table
  await sql`
    CREATE TABLE IF NOT EXISTS key_accounts (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      company text DEFAULT '',
      logo_url text DEFAULT '',
      position integer DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `
  console.log('✓ Created key_accounts table')

  // Create key_account_initiatives join table
  await sql`
    CREATE TABLE IF NOT EXISTS key_account_initiatives (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      key_account_id uuid NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
      initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      note text DEFAULT '',
      created_at timestamp DEFAULT now(),
      UNIQUE(key_account_id, initiative_id)
    )
  `
  console.log('✓ Created key_account_initiatives table')

  console.log('\nDone — parent initiatives + key accounts schema ready.')
}

main().catch(console.error)
