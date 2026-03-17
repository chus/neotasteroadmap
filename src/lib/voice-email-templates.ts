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
    ? '<p style="font-size:14px;color:#333;line-height:1.6;">You opted in to participate in research — we may reach out if we\'d like to learn more about your experience.</p>'
    : ''

  return {
    subject: "We received your feedback — " + title,
    html: layout(
      '<p style="font-size:14px;color:#333;line-height:1.6;">Hi ' + name + ',</p>' +
      '<p style="font-size:14px;color:#333;line-height:1.6;">Thank you for sharing your feedback with us. Your input helps us make NeoTaste better.</p>' +
      '<div style="margin:16px 0;padding:12px 16px;background:#f9f9f9;border-radius:8px;">' +
        '<p style="margin:0;font-size:13px;color:#333;font-weight:600;">' + title + '</p>' +
      '</div>' +
      '<p style="font-size:14px;color:#333;line-height:1.6;">Our product team reviews every submission. If we have questions or updates, we\'ll let you know.</p>' +
      researchNote +
      '<a href="https://neotasteroadmap.vercel.app/voice" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">View Voice portal</a>'
    ),
  }
}

export function voiceShippedNotification(
  submission: { name: string; title: string; body: string },
  cluster: { label: string },
  initiative: { title: string },
  releaseNote: string,
  impactMetric?: string | null,
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neotasteroadmap.vercel.app'
  const greeting = submission.name ? 'Hi ' + submission.name + ',' : 'Hi there,'

  const impactHtml = impactMetric
    ? '<p style="font-size:13px;color:#085041;margin:8px 0 0;">Early results: ' + impactMetric + '</p>'
    : ''

  return {
    subject: 'Something you asked for just shipped \u2014 NeoTaste',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:#0D2818;padding:24px 24px 20px;border-radius:0 0 12px 12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <img src="${appUrl}/neotaste-icon.png" alt="NeoTaste" width="28" height="28" style="border-radius:6px;" />
        <span style="color:#ffffff;font-size:14px;font-weight:600;">NeoTaste Voice</span>
      </div>
    </div>
    <div style="padding:24px;">
      <p style="font-size:14px;color:#333;line-height:1.6;">${greeting}</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">A while back you told us about something that wasn't working in the app.</p>
      <blockquote style="margin:16px 0;padding:12px 16px;background:#f9f9f9;border-left:3px solid #50E88A;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;color:#555;font-style:italic;">${submission.body}</p>
      </blockquote>
      <p style="font-size:14px;color:#333;line-height:1.6;">We heard you \u2014 and we just shipped something that addresses this.</p>
      <div style="margin:16px 0;padding:16px 20px;background:#E1F5EE;border-radius:8px;">
        <p style="margin:0;font-size:15px;color:#085041;font-weight:600;">${initiative.title}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#085041;">${releaseNote}</p>
        ${impactHtml}
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="${appUrl}/releases" style="display:inline-block;padding:10px 24px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">See what shipped &rarr;</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
      <p style="font-size:11px;color:#999;line-height:1.5;">
        You received this because you submitted feedback to NeoTaste Voice.
      </p>
    </div>
  </div>
</body>
</html>`,
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

  const messageHtml = message
    ? '<p style="font-size:14px;color:#333;line-height:1.6;">' + message + '</p>'
    : ''

  return {
    subject: "Update on your NeoTaste feedback: " + title,
    html: layout(
      '<p style="font-size:14px;color:#333;line-height:1.6;">Hi ' + name + ',</p>' +
      '<p style="font-size:14px;color:#333;line-height:1.6;">Your feedback <strong>' + title + '</strong> has been updated.</p>' +
      '<div style="margin:16px 0;">' +
        '<span style="display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:12px;background:#E6F1FB;color:#0C447C;">' + label + '</span>' +
      '</div>' +
      messageHtml +
      '<a href="https://neotasteroadmap.vercel.app/voice/status" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Check your feedback status</a>'
    ),
  }
}
