import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // 1. Create parent initiative "Card-linked offers"
  const [parent] = await sql`
    INSERT INTO initiatives (title, subtitle, criterion, "column", position, is_parent, parent_color, phase, track)
    VALUES (
      'Card-linked offers',
      'Strategic bet: enable restaurants to push card-linked offers to nearby NeoTaste users.',
      'execution_ready',
      'now',
      0,
      true,
      '#5E6AD2',
      'definition',
      'partner'
    )
    RETURNING id
  `
  console.log(`✓ Created parent initiative "Card-linked offers" (${parent.id})`)

  // 2. Find some existing initiatives to assign as children
  const existing = await sql`SELECT id, title FROM initiatives WHERE is_parent = false ORDER BY position LIMIT 3`
  if (existing.length > 0) {
    await sql`UPDATE initiatives SET parent_initiative_id = ${parent.id} WHERE id = ${existing[0].id}`
    console.log(`  → Assigned child: "${existing[0].title}"`)
  }
  if (existing.length > 1) {
    await sql`UPDATE initiatives SET parent_initiative_id = ${parent.id} WHERE id = ${existing[1].id}`
    console.log(`  → Assigned child: "${existing[1].title}"`)
  }

  // 3. Create key account "Steinecke franchise rollout"
  const [account] = await sql`
    INSERT INTO key_accounts (name, company, logo_url, position)
    VALUES ('Steinecke franchise rollout', 'Steinecke', '', 0)
    RETURNING id
  `
  console.log(`✓ Created key account "Steinecke franchise rollout" (${account.id})`)

  // 4. Link the key account to the first child
  if (existing.length > 0) {
    await sql`
      INSERT INTO key_account_initiatives (key_account_id, initiative_id, note)
      VALUES (${account.id}, ${existing[0].id}, 'Requires card-linked offers for franchise launch')
      ON CONFLICT DO NOTHING
    `
    console.log(`  → Linked key account to "${existing[0].title}"`)
  }

  console.log('\nDone — seed data for parent initiatives + key accounts ready.')
}

main().catch(console.error)
