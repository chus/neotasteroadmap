import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (token !== process.env.DIGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'SLACK_WEBHOOK_URL not configured' }, { status: 500 })
  }

  try {
    const { getVoiceDigestData } = await import('@/app/feedback-actions')
    const { sendSlackMessage, formatFeedbackDigest } = await import('@/lib/slack')

    const data = await getVoiceDigestData()
    const payload = formatFeedbackDigest(data)

    await sendSlackMessage(webhookUrl, payload)

    return NextResponse.json({ success: true, ...data })
  } catch (err) {
    console.error('[voice/slack-digest] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
