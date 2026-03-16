import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Find the Card-linked offers initiative
  const parents = await sql`SELECT id, title FROM initiatives WHERE is_parent = true AND title ILIKE '%card-linked%'`
  if (parents.length === 0) {
    console.log('Card-linked offers initiative not found — skipping seed')
    return
  }

  const cloId = parents[0].id
  console.log(`Found CLO initiative: ${parents[0].title} (${cloId})`)

  // Check if already seeded
  const existing = await sql`SELECT count(*) FROM decision_log WHERE initiative_id = ${cloId}`
  if (Number(existing[0].count) > 0) {
    console.log('Decision log already seeded — skipping')
    return
  }

  await sql`
    INSERT INTO decision_log (initiative_id, decision, rationale, made_by, decided_at) VALUES
    (${cloId}, 'Prioritising virtual card (VCC) approach over CLO API', 'More control over the user experience and merchant attribution. CLO APIs (Fidel, Cardlytics) have accuracy limitations and require Visa/Mastercard partnership agreements that add 6–12 months.', 'Agus', '2026-03-01'),
    (${cloId}, 'Stripe Issuing shortlisted as primary card issuing partner', 'Existing Stripe relationship, fastest time to prototype, good European coverage. Adyen and Marqeta kept as fallbacks pending commercial terms.', 'Agus', '2026-03-10')
  `

  console.log('Seeded 2 decision log entries for CLO')
}

main().catch(console.error)
