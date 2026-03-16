'use client'

import { useState } from 'react'
import { lookupFeedbackByEmail } from '@/app/feedback-actions'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Submitted', color: '#666', bg: '#f5f5f5' },
  reviewing: { label: 'Under review', color: '#0C447C', bg: '#E6F1FB' },
  actioned: { label: 'Actioned', color: '#085041', bg: '#E1F5EE' },
  archived: { label: 'Closed', color: '#888', bg: '#f5f5f5' },
  merged: { label: 'Merged', color: '#633806', bg: '#FAEEDA' },
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature idea',
  experience: 'Experience',
  pricing: 'Pricing',
  other: 'Other',
}

type FeedbackResult = {
  id: string
  title: string
  category: string
  status: string
  created_at: Date
  reviewed_at: Date | null
}

export default function StatusLookup() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState<FeedbackResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [looked, setLooked] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const data = await lookupFeedbackByEmail(email)
      setResults(data.map((r) => ({ ...r, created_at: new Date(r.created_at), reviewed_at: r.reviewed_at ? new Date(r.reviewed_at) : null })))
      setLooked(true)
    } catch {
      setResults([])
      setLooked(true)
    } finally {
      setLoading(false)
    }
  }

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div>
      {/* Lookup form */}
      <form onSubmit={handleLookup} className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">Check your feedback status</h2>
        <p className="text-[13px] text-neutral-500 mb-4">
          Enter the email you used when submitting feedback.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="text-[13px] font-medium px-5 py-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Looking up...' : 'Look up'}
          </button>
        </div>
      </form>

      {/* Results */}
      {looked && results !== null && (
        <div>
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
              <p className="text-[14px] text-neutral-500">
                No feedback found for this email address.
              </p>
              <p className="text-[12px] text-neutral-400 mt-2">
                Make sure you entered the same email you used when submitting.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] text-neutral-400">
                {results.length} submission{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new
                const steps = ['new', 'reviewing', 'actioned']
                const stepIndex = steps.indexOf(item.status)
                const isArchived = item.status === 'archived'

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-medium text-neutral-800 truncate">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-neutral-400">
                            {CATEGORY_LABELS[item.category] ?? item.category}
                          </span>
                          <span className="text-[11px] text-neutral-300">&middot;</span>
                          <span className="text-[11px] text-neutral-400">
                            {timeAgo(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Status timeline */}
                    {!isArchived && item.status !== 'merged' && (
                      <div className="flex items-center gap-0 mt-4">
                        {steps.map((s, i) => {
                          const active = i <= stepIndex
                          const labels = ['Submitted', 'Reviewing', 'Actioned']
                          return (
                            <div key={s} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div
                                  className={`w-3 h-3 rounded-full border-2 ${
                                    active
                                      ? 'bg-green-500 border-green-500'
                                      : 'bg-white border-neutral-300'
                                  }`}
                                />
                                <span className={`text-[10px] mt-1 ${active ? 'text-green-600 font-medium' : 'text-neutral-400'}`}>
                                  {labels[i]}
                                </span>
                              </div>
                              {i < steps.length - 1 && (
                                <div
                                  className={`h-0.5 flex-1 -mt-4 ${
                                    i < stepIndex ? 'bg-green-500' : 'bg-neutral-200'
                                  }`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isArchived && (
                      <p className="text-[12px] text-neutral-400 mt-2">
                        This feedback has been reviewed and closed. It has been recorded and may influence future decisions.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
