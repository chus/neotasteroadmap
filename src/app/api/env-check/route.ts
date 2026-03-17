import { NextResponse } from 'next/server'

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
  const resendKey = process.env.RESEND_API_KEY ?? ''
  const databaseUrl = process.env.DATABASE_URL ?? ''

  return NextResponse.json({
    anthropic: {
      exists: !!anthropicKey,
      length: anthropicKey.length,
      prefix: anthropicKey.substring(0, 12),
      suffix: anthropicKey.slice(-4),
      startsCorrectly: anthropicKey.startsWith('sk-ant-'),
      hasWhitespace: anthropicKey !== anthropicKey.trim(),
      trimmedLength: anthropicKey.trim().length,
    },
    resend: {
      exists: !!resendKey,
      length: resendKey.length,
      prefix: resendKey.substring(0, 6),
    },
    database: {
      exists: !!databaseUrl,
      length: databaseUrl.length,
      prefix: databaseUrl.substring(0, 20),
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
