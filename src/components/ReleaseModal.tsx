'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  initiativeTitle: string
  onConfirm: (releaseNote: string, impactMetric: string, measuredDate: string) => void
  onCancel: () => void
}

export default function ReleaseModal({ initiativeTitle, onConfirm, onCancel }: Props) {
  const [note, setNote] = useState('')
  const [impactMetric, setImpactMetric] = useState('')
  const [measuredDate, setMeasuredDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  async function handleConfirm() {
    if (!note.trim()) return
    setSaving(true)
    onConfirm(note.trim(), impactMetric.trim(), impactMetric.trim() ? measuredDate : '')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">
          Release initiative
        </h2>
        <p className="text-[13px] text-neutral-500 mb-4">
          Write a short release note for <span className="font-medium text-neutral-700">{initiativeTitle}</span>.
        </p>

        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What shipped? Keep it brief — this is visible on the board."
          rows={3}
          className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-neutral-400 resize-none"
        />

        <div className="mt-3 space-y-2">
          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Impact (optional)</label>
            <input
              type="text"
              value={impactMetric}
              onChange={(e) => setImpactMetric(e.target.value)}
              placeholder="Metric · change · timeframe"
              className="w-full mt-1 text-[13px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400"
            />
          </div>
          {impactMetric.trim() && (
            <div>
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Measured on</label>
              <input
                type="date"
                value={measuredDate}
                onChange={(e) => setMeasuredDate(e.target.value)}
                className="w-full mt-1 text-[13px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="text-[13px] px-4 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!note.trim() || saving}
            className="text-[13px] font-medium px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Releasing...' : 'Confirm release'}
          </button>
        </div>
      </div>
    </div>
  )
}
