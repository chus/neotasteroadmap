import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })
const { initiatives } = schema

interface SeedRow {
  title: string
  effort: string
  target_month: string | null
  is_public: boolean
  criterion_secondary: string | null
}

const SEED_DATA: SeedRow[] = [
  // NOW
  { title: 'Restaurant details page', effort: 'l', target_month: '2026-02', is_public: true, criterion_secondary: null },
  { title: 'Map pins', effort: 'm', target_month: '2026-02', is_public: true, criterion_secondary: null },
  { title: 'Redemption flow', effort: 'm', target_month: '2026-03', is_public: true, criterion_secondary: null },
  { title: 'Redemption banners', effort: 's', target_month: '2026-01', is_public: true, criterion_secondary: null },
  { title: 'Attribution survey', effort: 's', target_month: '2026-01', is_public: false, criterion_secondary: null },
  { title: 'Vouchers on plan level', effort: 'm', target_month: '2026-03', is_public: true, criterion_secondary: 'dependency' },
  { title: 'Trial benefits cancellation', effort: 'l', target_month: '2026-03', is_public: true, criterion_secondary: null },
  { title: 'Frontend redirect button', effort: 'xs', target_month: '2026-01', is_public: false, criterion_secondary: null },

  // NEXT
  { title: "Places you'll love carousel", effort: 'm', target_month: '2026-04', is_public: true, criterion_secondary: null },
  { title: 'Partner referral page', effort: 'l', target_month: '2026-05', is_public: true, criterion_secondary: null },
  { title: 'Pricing experiments: churn', effort: 'l', target_month: '2026-05', is_public: false, criterion_secondary: 'research' },
  { title: 'Pricing test phase 1 & 2', effort: 'xl', target_month: '2026-06', is_public: false, criterion_secondary: null },
  { title: 'Partner portal media upload', effort: 'm', target_month: '2026-04', is_public: false, criterion_secondary: null },
  { title: 'Multiple locations display', effort: 's', target_month: '2026-04', is_public: true, criterion_secondary: null },
  { title: 'Book time off in admin', effort: 's', target_month: '2026-05', is_public: false, criterion_secondary: null },

  // LATER
  { title: 'Home page redesign', effort: 'xl', target_month: '2026-07', is_public: true, criterion_secondary: null },
  { title: 'Booking page', effort: 'l', target_month: '2026-07', is_public: true, criterion_secondary: null },
  { title: 'Filters & search', effort: 'l', target_month: '2026-08', is_public: true, criterion_secondary: null },
  { title: 'Value guarantee', effort: 'm', target_month: '2026-09', is_public: false, criterion_secondary: 'research' },
  { title: 'New user quest', effort: 'l', target_month: '2026-09', is_public: true, criterion_secondary: null },

  // PARKED
  { title: 'Reviews & photos', effort: 'xl', target_month: null, is_public: false, criterion_secondary: null },
  { title: 'Lists', effort: 'm', target_month: null, is_public: false, criterion_secondary: null },
  { title: 'Referral QR codes', effort: 'm', target_month: null, is_public: false, criterion_secondary: null },
]

async function seed() {
  let updated = 0
  let notFound = 0

  for (const row of SEED_DATA) {
    const [existing] = await db
      .select({ id: initiatives.id })
      .from(initiatives)
      .where(eq(initiatives.title, row.title))
      .limit(1)

    if (!existing) {
      console.log(`  ✗ Not found: "${row.title}"`)
      notFound++
      continue
    }

    await db
      .update(initiatives)
      .set({
        effort: row.effort,
        target_month: row.target_month,
        is_public: row.is_public,
        criterion_secondary: row.criterion_secondary,
      })
      .where(eq(initiatives.id, existing.id))

    console.log(`  ✓ Updated: "${row.title}"`)
    updated++
  }

  // Summary
  const all = await db.select().from(initiatives)
  const withEffort = all.filter((i) => i.effort).length
  const withMonth = all.filter((i) => i.target_month).length
  const isPublic = all.filter((i) => i.is_public).length
  const withSecondary = all.filter((i) => i.criterion_secondary).length

  console.log('\n--- Summary ---')
  console.log(`Total updated: ${updated}`)
  console.log(`Not found: ${notFound}`)
  console.log(`With effort: ${withEffort}`)
  console.log(`With target_month: ${withMonth}`)
  console.log(`Marked is_public: ${isPublic}`)
  console.log(`With criterion_secondary: ${withSecondary}`)
}

seed().catch(console.error)
