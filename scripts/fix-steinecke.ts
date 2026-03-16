import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // 1. Find the Steinecke key account
  const accounts = await sql`SELECT id, name FROM key_accounts WHERE name ILIKE '%steinecke%' OR company ILIKE '%steinecke%' LIMIT 1`

  if (accounts.length === 0) {
    console.error('Steinecke key account not found')
    process.exit(1)
  }

  const steinecke = accounts[0]
  console.log(`Found key account: "${steinecke.name}" (${steinecke.id})`)

  // 2. Show current links
  const currentLinks = await sql`
    SELECT kai.id, i.title, i.id as initiative_id
    FROM key_account_initiatives kai
    JOIN initiatives i ON i.id = kai.initiative_id
    WHERE kai.key_account_id = ${steinecke.id}::uuid
  `
  console.log('Current links:', currentLinks.map((l) => l.title))

  // 3. Remove all existing links for this key account
  await sql`DELETE FROM key_account_initiatives WHERE key_account_id = ${steinecke.id}::uuid`
  console.log('Cleared existing links')

  // 4. Find the Partner strategic level
  const partnerLevels = await sql`SELECT id, name FROM strategic_levels WHERE name ILIKE '%partner%' LIMIT 1`
  const partnerLevelId = partnerLevels.length > 0 ? partnerLevels[0].id : null
  if (partnerLevelId) {
    console.log(`Found strategic level: "${partnerLevels[0].name}"`)
  }

  // 5. Find or create "Multiple locations display" initiative
  const existing = await sql`SELECT id, title FROM initiatives WHERE title ILIKE '%multiple locations%' LIMIT 1`

  let multiLocationId: string

  if (existing.length > 0) {
    multiLocationId = existing[0].id
    await sql`
      UPDATE initiatives SET
        title = 'Multiple locations display (Steinecke)',
        subtitle = 'Display franchise partners with multiple locations in a user-friendly way.',
        criterion = 'dependency',
        strategic_level_id = ${partnerLevelId}::uuid,
        "column" = 'next',
        effort = 's',
        target_month = '2026-04',
        is_public = true,
        dep_note = 'Steinecke franchise partner requirement'
      WHERE id = ${multiLocationId}::uuid
    `
    console.log(`Updated existing initiative: "${existing[0].title}" → "Multiple locations display (Steinecke)"`)
  } else {
    const created = await sql`
      INSERT INTO initiatives (title, subtitle, criterion, strategic_level_id, "column", effort, target_month, is_public, dep_note, position)
      VALUES (
        'Multiple locations display (Steinecke)',
        'Display franchise partners with multiple locations in a user-friendly way.',
        'dependency',
        ${partnerLevelId}::uuid,
        'next',
        's',
        '2026-04',
        true,
        'Steinecke franchise partner requirement',
        99
      )
      RETURNING id
    `
    multiLocationId = created[0].id
    console.log('Created new initiative: "Multiple locations display (Steinecke)"')
  }

  // 6. Link it to Steinecke key account
  await sql`
    INSERT INTO key_account_initiatives (key_account_id, initiative_id)
    VALUES (${steinecke.id}::uuid, ${multiLocationId}::uuid)
    ON CONFLICT DO NOTHING
  `
  console.log('Linked "Multiple locations display (Steinecke)" to Steinecke key account')

  // 7. Verify
  const verify = await sql`
    SELECT i.title
    FROM key_account_initiatives kai
    JOIN initiatives i ON i.id = kai.initiative_id
    WHERE kai.key_account_id = ${steinecke.id}::uuid
  `
  console.log('Verified links:', verify.map((v) => v.title))
  console.log('\nDone.')
}

main().catch(console.error)
