import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, COOKIE_NAME, COOKIE_VALUE } from '@/lib/password-gate'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (!validatePassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return response
}
