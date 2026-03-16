import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  const rows = await sql`SELECT id, title, criterion, "column" FROM initiatives`

  let fixed = 0
  for (const row of rows) {
    if (row.criterion === 'parked' && row.column !== 'parked') {
      await sql`UPDATE initiatives SET "column" = 'parked' WHERE id = ${row.id}::uuid`
      console.log(`Fixed: "${row.title}" → moved to parked column`)
      fixed++
    }
  }

  console.log(`\nDone — fixed ${fixed} initiative(s).`)
}

main().catch(console.error)
