import { NextResponse } from 'next/server'
import { runDriftDetection } from '@/app/actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token || token !== process.env.DIGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDriftDetection()

  return NextResponse.json({
    success: true,
    ...result,
  })
}
