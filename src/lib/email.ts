import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY?.trim()
const fromEmail = process.env.RESEND_FROM_EMAIL || 'roadmap@neotaste.app'

let resend: Resend | null = null

if (apiKey) {
  resend = new Resend(apiKey)
} else {
  console.warn('[email] RESEND_API_KEY not set — email notifications disabled')
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn('[email] Skipping email send — Resend not configured')
    return false
  }

  try {
    await resend.emails.send({
      from: `NeoTaste <${fromEmail}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('[email] Failed to send email:', err)
    return false
  }
}
