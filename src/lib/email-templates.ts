import type { FeatureRequest, RequestStatus } from '@/types'

// ─── Weekly Digest ───

function formatMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  return monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDigestSubject(): string {
  return `NeoTaste Roadmap — week of ${formatMonday()}`
}

export function weeklyDigest(
  data: {
    moves: { title: string; from: string; to: string }[]
    columnCounts: Record<string, number>
    newRequestCount: number
    topRequests: { title: string; vote_count: number; status: string }[]
    statusChangeCount: number
  },
  unsubscribeEmail: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neotasteroadmap.vercel.app'

  const columnLabels: Record<string, string> = { now: 'Now', next: 'Next', later: 'Later', parked: 'Parked' }

  const movesHtml = data.moves.length > 0
    ? data.moves.map((m) =>
        `<li style="margin-bottom:6px;font-size:13px;color:#333;">
          <strong>${m.title}</strong> moved from ${columnLabels[m.from] ?? m.from} → ${columnLabels[m.to] ?? m.to}
        </li>`
      ).join('')
    : '<p style="font-size:13px;color:#888;font-style:italic;">No changes this week — the board is stable.</p>'

  const requestsHtml = data.newRequestCount > 0 || data.statusChangeCount > 0
    ? `
      <div style="margin-top:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px;">Feature requests</h3>
        <p style="font-size:13px;color:#555;">${data.newRequestCount} new request${data.newRequestCount !== 1 ? 's' : ''} submitted</p>
        ${data.topRequests.length > 0
          ? `<ul style="list-style:none;padding:0;margin:8px 0 0;">
              ${data.topRequests.map((r) =>
                `<li style="margin-bottom:6px;font-size:13px;color:#333;">
                  ${r.title} — <strong>${r.vote_count}</strong> vote${r.vote_count !== 1 ? 's' : ''}
                  <span style="display:inline-block;font-size:10px;padding:2px 6px;border-radius:8px;background:#f1f1f1;color:#666;margin-left:4px;">${r.status}</span>
                </li>`
              ).join('')}
            </ul>`
          : ''
        }
      </div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <!-- Header -->
    <div style="background:#0D2818;padding:24px 24px 20px;border-radius:0 0 12px 12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <img src="${appUrl}/neotaste-icon.png" alt="NeoTaste" width="28" height="28" style="border-radius:6px;" />
        <span style="color:#ffffff;font-size:14px;font-weight:600;">Product Roadmap</span>
      </div>
      <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">Weekly digest — ${formatMonday()}</p>
    </div>

    <div style="padding:24px;">
      <!-- This week -->
      <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px;">This week on the roadmap</h3>
      <ul style="list-style:none;padding:0;margin:0;">${movesHtml}</ul>

      <!-- Snapshot -->
      <div style="margin-top:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px;">Snapshot</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px;text-align:center;background:#f9f9f9;border-radius:8px 0 0 0;">
              <div style="font-size:24px;font-weight:700;color:#333;">${data.columnCounts.now ?? 0}</div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Now</div>
            </td>
            <td style="padding:12px;text-align:center;background:#f9f9f9;border-radius:0 8px 0 0;">
              <div style="font-size:24px;font-weight:700;color:#333;">${data.columnCounts.next ?? 0}</div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Next</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px;text-align:center;background:#f9f9f9;border-radius:0 0 0 8px;">
              <div style="font-size:24px;font-weight:700;color:#333;">${data.columnCounts.later ?? 0}</div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Later</div>
            </td>
            <td style="padding:12px;text-align:center;background:#f9f9f9;border-radius:0 0 8px 0;">
              <div style="font-size:24px;font-weight:700;color:#333;">${data.columnCounts.parked ?? 0}</div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Parked</div>
            </td>
          </tr>
        </table>
      </div>

      ${requestsHtml}

      <!-- CTA -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${appUrl}" style="display:inline-block;padding:10px 24px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">View the roadmap &rarr;</a>
      </div>

      <!-- Footer -->
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
      <p style="font-size:11px;color:#999;line-height:1.5;text-align:center;">
        You're receiving this because you subscribed to the NeoTaste roadmap digest.
        <br />
        <a href="${appUrl}/api/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open', color: '#666', bg: '#F1F1F1' },
  under_review: { label: 'Under review', color: '#0C447C', bg: '#E6F1FB' },
  planned:      { label: 'Planned', color: '#3C3489', bg: '#EEEDFE' },
  declined:     { label: 'Declined', color: '#9B1C1C', bg: '#FEE9E9' },
  promoted:     { label: 'Promoted', color: '#085041', bg: '#E1F5EE' },
}

const STATUS_MESSAGES: Record<string, string> = {
  under_review: "We're looking into this. We may reach out if we have questions.",
  planned: "Good news — this is on our roadmap. We'll share more details when we're closer to building it.",
  declined: "After review, we've decided not to pursue this right now. This doesn't mean it won't change — if circumstances shift, it may come back.",
  promoted: 'This has been added to our product roadmap. Thank you for the detailed submission — it made a difference.',
}

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
      You're receiving this because you submitted a feature request to NeoTaste. No further emails unless your request status changes.
    </p>
  </div>
</body>
</html>`
}

function statusPill(status: string): string {
  const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return `<span style="display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:12px;background:${conf.bg};color:${conf.color};">${conf.label}</span>`
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0D2818;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`
}

export function statusChanged(request: FeatureRequest, newStatus: RequestStatus): { subject: string; html: string } {
  const message = STATUS_MESSAGES[newStatus] ?? ''
  const adminNoteBlock = request.admin_note
    ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f9f9f9;border-left:3px solid #50E88A;border-radius:0 8px 8px 0;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:4px;">From the product team:</div>
        <p style="margin:0;font-size:13px;color:#333;">${request.admin_note}</p>
       </blockquote>`
    : ''

  return {
    subject: `Update on your NeoTaste feature request: ${request.title}`,
    html: layout(`
      <p style="font-size:14px;color:#333;line-height:1.6;">Hi ${request.submitter_name},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">Your feature request <strong>${request.title}</strong> has been updated.</p>
      <div style="margin:16px 0;">${statusPill(newStatus)}</div>
      ${message ? `<p style="font-size:14px;color:#333;line-height:1.6;">${message}</p>` : ''}
      ${adminNoteBlock}
      ${ctaButton('View your request', `https://neotasteroadmap.vercel.app/requests#${request.id}`)}
    `),
  }
}

export function voteThreshold(request: FeatureRequest, voteCount: number): { subject: string; html: string } {
  return {
    subject: `Your NeoTaste request is gaining traction — ${voteCount} votes`,
    html: layout(`
      <p style="font-size:14px;color:#333;line-height:1.6;">Hi ${request.submitter_name},</p>
      <p style="font-size:14px;color:#333;line-height:1.6;"><strong>${request.title}</strong> now has <strong>${voteCount} votes</strong> from other NeoTaste users.</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">We review high-voted requests in our monthly planning cycle.</p>
      ${ctaButton('View your request', `https://neotasteroadmap.vercel.app/requests#${request.id}`)}
    `),
  }
}
