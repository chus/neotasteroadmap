'use client'

import { useState, useEffect, useRef } from 'react'
import type { KeyAccount } from '@/types'

interface Props {
  account?: KeyAccount
  onSave: (data: { name: string; company: string; logo_url: string }) => void
  onClose: () => void
}

export default function KeyAccountModal({ account, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: account?.name ?? '',
    company: account?.company ?? '',
    logo_url: account?.logo_url ?? '',
  })

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    onSave(form)
  }

  const isNew = !account

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-sm p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-neutral-800">
          {isNew ? 'Add key account' : 'Edit key account'}
        </h3>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Name</label>
          <input
            className="mt-1 w-full text-[13px] font-medium border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Steinecke franchise rollout"
            autoFocus
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Company</label>
          <input
            className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company name (optional)"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Logo URL</label>
          <input
            className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://... (optional)"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isNew ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
