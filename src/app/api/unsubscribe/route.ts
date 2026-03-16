import { unsubscribeFromDigest } from '@/app/actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (email) {
    await unsubscribeFromDigest(email)
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa;">
  <div style="text-align:center;padding:40px;">
    <h1 style="font-size:18px;color:#333;margin-bottom:8px;">You have been unsubscribed</h1>
    <p style="font-size:14px;color:#888;">You will no longer receive the weekly roadmap digest.</p>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
