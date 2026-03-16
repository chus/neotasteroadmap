import { createHash } from 'crypto'
import { headers } from 'next/headers'

export async function getFingerprint(): Promise<string> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? 'unknown'
  const userAgent = hdrs.get('user-agent') ?? 'unknown'
  return createHash('sha256').update(ip + userAgent).digest('hex')
}
