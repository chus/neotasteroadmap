import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Check 1: Parent initiatives
  const parents = await sql`SELECT id, title, is_parent, parent_color, phase, "column", position FROM initiatives WHERE is_parent = true`
  console.log('Parent initiatives in DB:', parents)

  // Check 2: Children linked to parents
  if (parents.length > 0) {
    for (const p of parents) {
      const children = await sql`SELECT id, title, parent_initiative_id, "column" FROM initiatives WHERE parent_initiative_id = ${p.id}`
      console.log(`\nChildren of "${p.title}" (${p.id}):`, children)
    }
  }

  // Check 3: Key accounts
  const accounts = await sql`SELECT * FROM key_accounts`
  console.log('\nKey accounts:', accounts)

  // Check 4: Key account links
  const links = await sql`SELECT * FROM key_account_initiatives`
  console.log('Key account links:', links)
}

main().catch(console.error)
