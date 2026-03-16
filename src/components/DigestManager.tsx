'use client'

import { useState } from 'react'
import { deleteDigestSubscriber, toggleDigestSubscriber } from '@/app/actions'
import type { DigestSubscriber } from '@/types'

interface Props {
  initialSubscribers: DigestSubscriber[]
  cronSecret: string
}

export default function DigestManager({ initialSubscribers, cronSecret }: Props) {
  const [subscribers, setSubscribers] = useState<DigestSubscriber[]>(initialSubscribers)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  async function handleToggle(id: string, isActive: boolean) {
    await toggleDigestSubscriber(id, !isActive)
    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s))
    )
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this subscriber?')) return
    await deleteDigestSubscriber(id)
    setSubscribers((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleTestSend() {
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch(`/api/digest/send?token=${encodeURIComponent(cronSecret)}&test=true`)
      const data = await res.json()
      setSendResult(`Test sent to ${data.sent} subscriber(s)`)
    } catch {
      setSendResult('Failed to send test')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-800">Digest subscribers</h2>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Weekly digest email sent every Monday at 08:00 UTC.
          </p>
        </div>
        <button
          onClick={handleTestSend}
          disabled={sending || subscribers.filter((s) => s.is_active).length === 0}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
        >
          {sending ? 'Sending...' : 'Send test digest'}
        </button>
      </div>

      {sendResult && (
        <p className="text-[12px] text-neutral-500 mb-3 bg-neutral-50 rounded-lg px-3 py-2">{sendResult}</p>
      )}

      {subscribers.length === 0 ? (
        <p className="text-[12px] text-neutral-400 italic">No subscribers yet.</p>
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-left">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Subscribed</th>
                <th className="px-3 py-2 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-700 font-medium">{sub.email}</td>
                  <td className="px-3 py-2 text-neutral-500">{sub.name || '—'}</td>
                  <td className="px-3 py-2 text-neutral-400">
                    {new Date(sub.subscribed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(sub.id, sub.is_active)}
                        className={`text-[11px] ${sub.is_active ? 'text-green-600' : 'text-neutral-400'}`}
                      >
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleRemove(sub.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
