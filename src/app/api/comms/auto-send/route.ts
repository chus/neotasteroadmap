import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { commsDigests } from '@/db/schema'
import { and, eq, lte } from 'drizzle-orm'
import { sendDigest } from '@/app/actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (token !== process.env.DIGEST_CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const pending = await db
    .select()
    .from(commsDigests)
    .where(
      and(
        eq(commsDigests.status, 'draft'),
        lte(commsDigests.auto_send_at, new Date())
      )
    )

  const results = []
  for (const digest of pending) {
    const result = await sendDigest(digest.id)
    results.push({ id: digest.id, period: digest.period_label, ...result })
  }

  return NextResponse.json({ processed: results.length, results })
}
