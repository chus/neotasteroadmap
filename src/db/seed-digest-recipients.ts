import 'dotenv/config'
import { db } from './index'
import { digestRecipients } from './schema'

async function main() {
  await db.insert(digestRecipients).values({
    email: 'agus@neotaste.app',
    name: 'Agus',
    role: 'Product',
    is_active: true,
  }).onConflictDoNothing()

  console.log('Recipients seeded')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
