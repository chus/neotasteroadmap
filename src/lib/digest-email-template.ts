import type { DigestData, ShippedItem } from './comms-agent'

interface DraftItem {
  title: string
  headline: string
  body: string
  impact: string | null
  user_signal: string | null
}

interface Draft {
  subject: string
  opening: string
  items: DraftItem[]
  voice_section: string | null
  closing: string
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderDigestEmail(draft: Draft, data: DigestData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neotasteroadmap.vercel.app'
  const subjectFirstPart = draft.subject.includes('—') ? draft.subject.split('—')[0].trim() : draft.subject

  // Build shipped item cards
  const itemCards = draft.items.map((draftItem, i) => {
    const shipped = data.shipped[i] as ShippedItem | undefined
    const color = shipped?.strategic_level_color ?? '#999'
    const areaName = shipped?.strategic_level_name ?? ''

    const impactHtml = draftItem.impact
      ? `<div style="display:inline-block;background:#E1F5EE;border-radius:20px;padding:6px 14px;font-size:12px;color:#085041;font-weight:600;margin-bottom:12px">\u2191 ${escapeHtml(draftItem.impact)}</div>`
      : ''

    const userSignalHtml = draftItem.user_signal
      ? `<div style="border-left:3px solid #50E88A;margin-top:12px;padding:10px 16px;background:#F8FFF9;border-radius:0 6px 6px 0"><p style="font-size:13px;color:#555555;font-style:italic;margin:0;line-height:1.6">"${escapeHtml(draftItem.user_signal)}"</p></div>`
      : ''

    return `<div style="margin:16px 40px 0;border:1px solid #E8E8E8;border-left:4px solid ${color};border-radius:8px;background:#FFFFFF;overflow:hidden">
  <div style="padding:20px 24px">
    <div style="font-size:10px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">${escapeHtml(areaName)}</div>
    <h2 style="font-size:18px;font-weight:700;color:#0D2818;margin:0 0 10px;line-height:1.3">${escapeHtml(draftItem.headline)}</h2>
    <p style="font-size:14px;line-height:1.8;color:#444444;margin:0 0 14px">${escapeHtml(draftItem.body)}</p>
    ${impactHtml}
    ${userSignalHtml}
  </div>
</div>`
  }).join('\n')

  // Stats strip
  const statsItems = [`<td style="text-align:center;padding:0 12px"><div style="font-size:32px;font-weight:700;color:#0D2818;line-height:1">${data.shipped_count}</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px">shipped</div></td>`]

  if (data.items_with_impact > 0) {
    statsItems.push(`<td style="text-align:center;padding:0 12px;border-left:1px solid #E0E0E0"><div style="font-size:32px;font-weight:700;color:#1D9E75;line-height:1">${data.items_with_impact}</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px">with impact</div></td>`)
  }

  if (data.voice_clusters_actioned > 0) {
    statsItems.push(`<td style="text-align:center;padding:0 12px;border-left:1px solid #E0E0E0"><div style="font-size:32px;font-weight:700;color:#7F77DD;line-height:1">${data.voice_clusters_actioned}</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px">user themes</div></td>`)
  }

  const statsStrip = statsItems.length > 0
    ? `<div style="background:#F5F5F5;padding:20px 40px;border-bottom:1px solid #E8E8E8"><table style="width:100%;border-collapse:collapse"><tr>${statsItems.join('')}</tr></table></div>`
    : ''

  // Voice section
  const voiceHtml = draft.voice_section
    ? `<div style="margin:20px 40px 0;background:#EEEDFE;border-radius:8px;padding:20px 24px">
  <div style="font-size:10px;font-weight:600;color:#534AB7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">What users are telling us</div>
  <p style="font-size:14px;line-height:1.7;color:#3C3489;margin:0">${escapeHtml(draft.voice_section)}</p>
</div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px 0;background:#F0F0F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#0D2818;padding:32px 40px;text-align:center">
      <p style="color:#50E88A;font-size:12px;font-weight:600;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em">NeoTaste Product Team</p>
      <h1 style="color:#FFFFFF;font-size:26px;font-weight:700;margin:0 0 8px;line-height:1.2">${escapeHtml(subjectFirstPart)}</h1>
      <p style="color:#888888;font-size:13px;margin:0">${escapeHtml(data.period_label)}</p>
    </div>
    ${statsStrip}
    <div style="padding:32px 40px 8px">
      <p style="font-size:15px;line-height:1.8;color:#2C2C2A;margin:0">${escapeHtml(draft.opening)}</p>
    </div>
    ${itemCards}
    ${voiceHtml}
    <div style="padding:24px 40px 32px">
      <p style="font-size:14px;line-height:1.8;color:#2C2C2A;margin:0">${escapeHtml(draft.closing)}</p>
    </div>
    <div style="background:#F8F8F8;border-top:1px solid #E8E8E8;padding:24px 40px;text-align:center">
      <p style="font-size:12px;color:#999999;margin:0 0 8px">NeoTaste Product Team \u00b7 ${escapeHtml(data.period_label)}</p>
      <a href="${appUrl}/shipped" style="font-size:12px;color:#1D9E75;text-decoration:none">View full shipped history \u2192</a>
      <br><br>
      <a href="${appUrl}/api/unsubscribe?email=RECIPIENT_EMAIL" style="font-size:11px;color:#BBBBBB;text-decoration:none">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`
}
