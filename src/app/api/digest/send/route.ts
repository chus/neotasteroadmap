import { getDigestSubscribers, getWeeklyDigestData } from '@/app/actions'
import { sendEmail } from '@/lib/email'
import { getDigestSubject, weeklyDigest } from '@/lib/email-templates'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (token !== process.env.DIGEST_CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const isTest = searchParams.get('test') === 'true'

  const [subscribers, data] = await Promise.all([
    getDigestSubscribers(),
    getWeeklyDigestData(),
  ])

  const targets = isTest ? subscribers.slice(0, 1) : subscribers

  if (targets.length === 0) {
    return Response.json({ sent: 0, failed: 0, message: 'No active subscribers' })
  }

  const subject = getDigestSubject()

  const results = await Promise.allSettled(
    targets.map((sub) =>
      sendEmail(sub.email, subject, weeklyDigest(data, sub.email))
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return Response.json({ sent, failed, test: isTest })
}
