import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/password-gate'

const PUBLIC_ROUTES = [
  '/voice',
  '/public',
  '/releases',
  '/requests',
  '/how-it-works',
  '/login',
  '/api/auth',
  '/api/unsubscribe',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|ico|svg|webp)$/)
  ) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
  if (isPublic) return NextResponse.next()

  if (!isAuthenticated(request)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
