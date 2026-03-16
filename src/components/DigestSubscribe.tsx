'use client'

import { useState, useEffect } from 'react'
import { subscribeToDigest } from '@/app/actions'

export default function DigestSubscribe() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('digest_subscribed')
    if (stored) setSubscribed(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      await subscribeToDigest(email.trim())
      localStorage.setItem('digest_subscribed', email.trim())
      setSubscribed(true)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  if (subscribed) {
    return (
      <div className="mt-8 text-center py-4">
        <p className="text-[12px] text-neutral-400">Subscribed to weekly digest</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex items-center justify-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="text-[12px] border border-neutral-200 rounded-lg px-3 py-1.5 w-56 outline-none focus:border-neutral-400"
      />
      <button
        type="submit"
        disabled={submitting}
        className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40"
      >
        {submitting ? 'Subscribing...' : 'Get weekly digest'}
      </button>
    </form>
  )
}
