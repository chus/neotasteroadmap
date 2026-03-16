import { NextRequest, NextResponse } from 'next/server'

const VOICE_HOSTNAME = 'voice.neotasteroadmap.vercel.app'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // ── Voice subdomain: only /voice routes allowed ──────────
  if (hostname === VOICE_HOSTNAME || hostname.startsWith('voice.')) {
    // Allow Next.js internals and static assets
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.match(/\.(png|jpg|jpeg|ico|svg|webp|css|js)$/)
    ) {
      return NextResponse.next()
    }

    // Allow /voice and /voice/* (including /voice/status)
    if (pathname === '/voice' || pathname.startsWith('/voice/')) {
      return NextResponse.next()
    }

    // Everything else on voice subdomain → redirect to /voice
    return NextResponse.redirect(new URL('/voice', request.url))
  }

  // ── Main domain: no restrictions ────────────────────────
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
