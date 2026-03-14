import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { initiatives } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const seedData = [
  // Column: now
  { title: 'Restaurant details page', track: 'discovery', criterion: 'execution_ready', column: 'now', position: 0, dep_note: '' },
  { title: 'Map pins', track: 'discovery', criterion: 'execution_ready', column: 'now', position: 1, dep_note: '' },
  { title: 'Redemption flow', track: 'discovery', criterion: 'execution_ready', column: 'now', position: 2, dep_note: '' },
  { title: 'Redemption banners', track: 'discovery', criterion: 'execution_ready', column: 'now', position: 3, dep_note: '' },
  { title: 'Attribution survey', track: 'conversion', criterion: 'foundation', column: 'now', position: 4, dep_note: '' },
  { title: 'Vouchers on plan level', track: 'conversion', criterion: 'dependency', column: 'now', position: 5, dep_note: '' },
  { title: 'Trial benefits cancellation', track: 'conversion', criterion: 'execution_ready', column: 'now', position: 6, dep_note: '' },
  { title: 'Frontend redirect button', track: 'partner', criterion: 'foundation', column: 'now', position: 7, dep_note: '' },

  // Column: next
  { title: "Places you'll love carousel", track: 'discovery', criterion: 'execution_ready', column: 'next', position: 0, dep_note: '' },
  { title: 'Partner referral page', track: 'conversion', criterion: 'dependency', column: 'next', position: 1, dep_note: 'needs vouchers on plan level first' },
  { title: 'Pricing experiments: churn', track: 'churn', criterion: 'research', column: 'next', position: 2, dep_note: 'needs attribution survey data' },
  { title: 'Pricing test phase 1 & 2', track: 'conversion', criterion: 'research', column: 'next', position: 3, dep_note: 'needs pricing infra spike' },
  { title: 'Partner portal media upload', track: 'partner', criterion: 'execution_ready', column: 'next', position: 4, dep_note: 'unblocked by redirect button' },
  { title: 'Multiple locations display', track: 'partner', criterion: 'execution_ready', column: 'next', position: 5, dep_note: '' },
  { title: 'Book time off in admin', track: 'partner', criterion: 'foundation', column: 'next', position: 6, dep_note: '' },

  // Column: later
  { title: 'Home page redesign', track: 'discovery', criterion: 'execution_ready', column: 'later', position: 0, dep_note: 'design scoping in Q2' },
  { title: 'Booking page', track: 'discovery', criterion: 'execution_ready', column: 'later', position: 1, dep_note: 'after redemption flow ships' },
  { title: 'Filters & search', track: 'discovery', criterion: 'execution_ready', column: 'later', position: 2, dep_note: 'design spike needed in Q2' },
  { title: 'Value guarantee', track: 'conversion', criterion: 'research', column: 'later', position: 3, dep_note: 'needs conversion baseline first' },
  { title: 'New user quest', track: 'conversion', criterion: 'research', column: 'later', position: 4, dep_note: 'needs attribution data and onboarding audit' },

  // Column: parked
  { title: 'Reviews & photos', track: 'discovery', criterion: 'parked', column: 'parked', position: 0, dep_note: 'full scope too large — partial folded into restaurant page' },
  { title: 'Lists', track: 'discovery', criterion: 'parked', column: 'parked', position: 1, dep_note: 'no activation mechanic defined yet' },
  { title: 'Referral QR codes', track: 'conversion', criterion: 'parked', column: 'parked', position: 2, dep_note: 'depends on referral programme strategy not scoped' },
]

async function seed() {
  console.log('Seeding database...')
  await db.insert(initiatives).values(seedData)
  console.log(`Inserted ${seedData.length} initiatives.`)
  console.log('Done!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
