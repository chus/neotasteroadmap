'use client'

import { useState } from 'react'
import FeedbackCard from './FeedbackCard'
import type { FeedbackSubmission, FeedbackStatus, FeedbackCategory } from '@/types'

const STATUS_FILTERS: { id: FeedbackStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'actioned', label: 'Actioned' },
  { id: 'archived', label: 'Archived' },
]

const CATEGORY_FILTERS: { id: FeedbackCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bug', label: 'Bug' },
  { id: 'feature', label: 'Feature' },
  { id: 'experience', label: 'Experience' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'other', label: 'Other' },
]

interface Props {
  initialSubmissions: FeedbackSubmission[]
}

export default function FeedbackInbox({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.body.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    reviewing: submissions.filter((s) => s.status === 'reviewing').length,
    actioned: submissions.filter((s) => s.status === 'actioned').length,
    archived: submissions.filter((s) => s.status === 'archived').length,
  }

  function handleUpdate(updated: FeedbackSubmission) {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Status pills */}
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === f.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {f.label}
              {f.id !== 'all' && (counts as Record<string, number>)[f.id] > 0 && (
                <span className="ml-1 opacity-60">{(counts as Record<string, number>)[f.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | 'all')}
          className="text-[11px] font-medium px-2 py-1 rounded border border-neutral-200 bg-white outline-none"
        >
          {CATEGORY_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          className="text-[12px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400 w-48"
        />

        <span className="text-[11px] text-neutral-400 ml-auto">
          {filtered.length} of {submissions.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map((s) => (
          <FeedbackCard key={s.id} submission={s} onUpdate={handleUpdate} />
        ))}
        {filtered.length === 0 && (
          <p className="text-[13px] text-neutral-400 text-center py-12 italic">
            {submissions.length === 0 ? 'No feedback submissions yet.' : 'No feedback matches your filters.'}
          </p>
        )}
      </div>
    </div>
  )
}
