import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyDigest } from '@/app/actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (token !== process.env.DIGEST_CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await generateMonthlyDigest()
  return NextResponse.json(result)
}
