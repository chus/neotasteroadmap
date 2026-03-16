import { NextRequest } from 'next/server'

const COOKIE_NAME = 'nt-auth'
const COOKIE_VALUE = 'authenticated'

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(COOKIE_NAME)
  return cookie?.value === COOKIE_VALUE
}

export function validatePassword(password: string): boolean {
  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) return true // If no password set, allow all
  return password === sitePassword
}

export { COOKIE_NAME, COOKIE_VALUE }
