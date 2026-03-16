import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { feedbackSubmissions } from '@/db/schema'
import { isNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (token !== process.env.DIGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { embedFeedback, runClustering } = await import('@/app/feedback-actions')

    // Embed all un-embedded submissions
    const unEmbedded = await db.select({ id: feedbackSubmissions.id })
      .from(feedbackSubmissions)
      .where(isNull(feedbackSubmissions.embedding))

    let embedded = 0
    for (const sub of unEmbedded) {
      await embedFeedback(sub.id)
      embedded++
      // Rate limit: 300ms between API calls
      if (embedded < unEmbedded.length) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    // Run clustering
    const clusterResult = await runClustering()

    return NextResponse.json({
      success: true,
      embedded,
      clustersCreated: clusterResult.clustersCreated,
      submissionsAssigned: clusterResult.submissionsAssigned,
    })
  } catch (err) {
    console.error('[voice/trends] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
