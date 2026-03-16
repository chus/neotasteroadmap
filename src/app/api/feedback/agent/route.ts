import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (token !== process.env.DIGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runFeedbackAgent } = await import('@/lib/feedback-agent')
    const report = await runFeedbackAgent()
    return NextResponse.json(report)
  } catch (err) {
    console.error('[feedback/agent] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
