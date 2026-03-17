'use client'

import { useState, useEffect } from 'react'
import { sendDigest } from '@/app/actions'

export function AutoSendCountdown({ autoSendAt }: { autoSendAt: Date }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(autoSendAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Sending soon...'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`Auto-sends in ${h}h ${m}m`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [autoSendAt])

  return <span style={{ fontSize: 11, color: '#EF9F27' }}>{timeLeft}</span>
}

export function SendNowButton({ digestId }: { digestId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSend = async () => {
    if (!confirm('Send this digest to all recipients now?')) return
    setLoading(true)
    await sendDigest(digestId)
    setDone(true)
    setLoading(false)
  }

  if (done) return <span style={{ fontSize: 12, color: '#50E88A' }}>Sent &#x2713;</span>

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      style={{
        fontSize: 12,
        padding: '6px 14px',
        borderRadius: 6,
        background: '#50E88A',
        color: '#0D2818',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Sending...' : 'Send now'}
    </button>
  )
}
