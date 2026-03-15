import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { asc } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })
const { initiatives } = schema

async function check() {
  const rows = await db
    .select({
      title: initiatives.title,
      column: initiatives.column,
      effort: initiatives.effort,
      target_month: initiatives.target_month,
      is_public: initiatives.is_public,
      criterion_secondary: initiatives.criterion_secondary,
    })
    .from(initiatives)
    .orderBy(asc(initiatives.column), asc(initiatives.position))

  console.table(rows)

  const total = rows.length
  const withEffort = rows.filter((r) => r.effort != null).length
  const withMonth = rows.filter((r) => r.target_month != null).length
  const publicCount = rows.filter((r) => r.is_public === true).length
  const withSecondary = rows.filter((r) => r.criterion_secondary != null).length

  console.log(`\nTotal: ${total}`)
  console.log(`With effort: ${withEffort}`)
  console.log(`With target_month: ${withMonth}`)
  console.log(`is_public=true: ${publicCount}`)
  console.log(`With criterion_secondary: ${withSecondary}`)
}

check().catch(console.error)
