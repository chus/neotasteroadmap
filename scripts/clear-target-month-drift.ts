import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

interface DriftField {
  field: string
  label: string
  roadmapValue: string
  linearValue: string
  severity: string
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  const rows = await sql`SELECT id, title, sync_drift FROM initiatives WHERE sync_status = 'drift' AND sync_drift IS NOT NULL`

  let cleared = 0
  let kept = 0

  for (const row of rows) {
    const fields: DriftField[] = JSON.parse(row.sync_drift)
    const nonTargetFields = fields.filter((f) => f.field !== 'target_month')
    const highSeverityRemaining = nonTargetFields.filter((f) => f.severity === 'high')

    if (highSeverityRemaining.length === 0) {
      // Was only drifting on target_month (and/or low-severity fields) — clear drift status
      await sql`
        UPDATE initiatives SET
          sync_status = 'in_sync',
          sync_drift = ${nonTargetFields.length > 0 ? JSON.stringify(nonTargetFields) : null},
          sync_drift_detected_at = NULL
        WHERE id = ${row.id}::uuid
      `
      console.log(`Cleared false drift on: ${row.title}`)
      cleared++
    } else {
      // Real drift remains — just remove target_month from the stored diff
      await sql`
        UPDATE initiatives SET
          sync_drift = ${JSON.stringify(nonTargetFields)}
        WHERE id = ${row.id}::uuid
      `
      console.log(`Kept drift on: ${row.title} (${highSeverityRemaining.map((f: DriftField) => f.field).join(', ')})`)
      kept++
    }
  }

  console.log(`\nDone — cleared ${cleared}, kept ${kept} drift records`)
}

main().catch(console.error)
