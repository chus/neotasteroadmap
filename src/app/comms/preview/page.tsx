import { getDigestHistory } from '@/app/actions'
import Link from 'next/link'
import { AutoSendCountdown, SendNowButton } from './client'

export const dynamic = 'force-dynamic'

export default async function CommsPreview() {
  const digests = await getDigestHistory()
  const latest = digests.find(d => d.status === 'draft' || d.status === 'sent') ?? null

  if (!latest) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#999' }}>
        <p style={{ fontSize: 16, marginBottom: 8 }}>No digest generated yet</p>
        <p style={{ fontSize: 13, marginBottom: 20 }}>
          Go to /comms and generate one to see a preview here.
        </p>
        <Link href="/comms" style={{ fontSize: 13, color: '#50E88A' }}>
          Go to Comms &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F0' }}>
      {/* Top bar */}
      <div style={{
        background: '#0D2818',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/comms" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
            &larr; Back to comms
          </Link>
          <span style={{ color: '#444', fontSize: 12 }}>|</span>
          <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 500 }}>
            {latest.period_label} &middot; Preview
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: 10,
            background: latest.status === 'draft' ? '#FAEEDA' : '#E1F5EE',
            color: latest.status === 'draft' ? '#633806' : '#085041',
          }}>
            {latest.status === 'draft' ? 'Draft' : 'Sent'}
          </span>
          {latest.status === 'draft' && latest.auto_send_at && (
            <AutoSendCountdown autoSendAt={latest.auto_send_at} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {latest.status === 'draft' && (
            <>
              <Link
                href={`/comms?review=${latest.id}`}
                style={{
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '0.5px solid #444',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                }}
              >
                Edit
              </Link>
              <SendNowButton digestId={latest.id} />
            </>
          )}
        </div>
      </div>

      {/* Email body */}
      <div style={{ maxWidth: 640, margin: '24px auto', padding: '0 20px 40px' }}>
        <div dangerouslySetInnerHTML={{ __html: latest.email_html }} />
      </div>
    </div>
  )
}
