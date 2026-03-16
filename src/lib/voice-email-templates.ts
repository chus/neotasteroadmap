function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="margin-bottom:24px;">
      <img src="https://neotasteroadmap.vercel.app/neotaste-icon.png" alt="NeoTaste" width="32" height="32" style="border-radius:6px;" />
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
    <p style="font-size:11px;color:#999;line-height:1.5;">
      You're receiving this because you submitted feedback to NeoTaste. No further emails unless your feedback status changes.
    </p>
  </div>
</body>
</html>`
}

export function feedbackConfirmation(
  name: string,
  title: string,
  researchOptIn: boolean
): { subject: string; html: string } {
  const researchNote = researchOptIn
    ? `<p style="font-size:14px;color:#333;line-height:1.6;">You opted in to participate in research — we may reach out if we'd like to learn more about your experience.</p>`
    : ''

  return {
    subject: `We received your feedback — ${title}`,
    html: layout(`
      <p style="font-size:14px;color:#333;line-height:1.6;">Hi ${name},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">Thank you for sharing your feedback with us. Your input helps us make NeoTaste better.</p>
      <div style="margin:16px 0;padding:12px 16px;background:#f9f9f9;border-radius:8px;">
        <p style="margin:0;font-size:13px;color:#333;font-weight:600;">${title}</p>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.6;">Our product team reviews every submission. If we have questions or updates, we'll let you know.</p>
      ${researchNote}
      <a href="https://neotasteroadmap.vercel.app/voice" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">View Voice portal</a>
    `),
  }
}

const STATUS_LABELS: Record<string, string> = {
  reviewing: 'Under review',
  actioned: 'Actioned',
  archived: 'Closed',
}

const STATUS_MESSAGES: Record<string, string> = {
  reviewing: "We're looking into this. We may reach out if we have questions about your experience.",
  actioned: 'Good news — your feedback has been connected to a product initiative. Thank you for helping us improve.',
  archived: "After review, we've noted your feedback. While we may not act on it immediately, it has been recorded and may influence future decisions.",
}

export function feedbackStatusUpdate(
  name: string,
  title: string,
  status: string,
): { subject: string; html: string } {
  const label = STATUS_LABELS[status] ?? status
  const message = STATUS_MESSAGES[status] ?? ''

  return {
    subject: `Update on your NeoTaste feedback: ${title}`,
    html: layout(`
      <p style="font-size:14px;color:#333;line-height:1.6;">Hi ${name},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">Your feedback <strong>${title}</strong> has been updated.</p>
      <div style="margin:16px 0;">
        <span style="display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:12px;background:#E6F1FB;color:#0C447C;">${label}</span>
      </div>
      ${message ? `<p style="font-size:14px;color:#333;line-height:1.6;">${message}</p>` : ''}
      <a href="https://neotasteroadmap.vercel.app/voice/status" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Check your feedback status</a>
    `),
  }
}
