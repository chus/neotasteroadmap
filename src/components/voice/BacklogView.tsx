'use client'

import { useState } from 'react'
import {
  setBacklogStatus,
  updateBacklogItem,
  promoteBacklogToRoadmap,
  declineBacklogItem,
  getProblemBacklog,
} from '@/app/feedback-actions'
import type { ProblemBacklogItem, BacklogStatus } from '@/types'

const STATUS_CONFIG: Record<BacklogStatus, { label: string; color: string; bg: string }> = {
  watching:  { label: 'Watching',  color: '#92400E', bg: '#FEF3C7' },
  backlog:   { label: 'Backlog',   color: '#3C3489', bg: '#EEEDFE' },
  promoted:  { label: 'Promoted',  color: '#085041', bg: '#E1F5EE' },
  declined:  { label: 'Declined',  color: '#888',    bg: '#f5f5f5' },
}

const AREA_COLORS: Record<string, string> = {
  Discovery: '#378ADD',
  Churn: '#D85A30',
  'Trial conversion': '#7F77DD',
  Partner: '#1D9E75',
  Other: '#888780',
}

const CRITERIA = [
  { id: 'execution_ready', label: 'Execution ready' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'dependency', label: 'Dependency' },
  { id: 'research', label: 'Research needed' },
]

interface Props {
  initialItems: ProblemBacklogItem[]
  counts: { watching: number; backlog: number; promoted: number; declined: number; watchingDueCount: number }
  strategicLevels: { id: string; name: string }[]
}

export default function BacklogView({ initialItems, counts, strategicLevels }: Props) {
  const [items, setItems] = useState(initialItems)
  const [statusFilter, setStatusFilter] = useState<BacklogStatus | 'all'>('all')
  const [areaFilter, setAreaFilter] = useState<string | 'all'>('all')
  const [promoteModal, setPromoteModal] = useState<string | null>(null)
  const [declineModal, setDeclineModal] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [promoting, setPromoting] = useState(false)

  // Promote form
  const [promoteForm, setPromoteForm] = useState({
    column: 'next',
    criterion: 'execution_ready',
    strategicLevelId: strategicLevels[0]?.id ?? '',
  })

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (areaFilter !== 'all' && item.strategic_area !== areaFilter) return false
    return true
  })

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

  function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null
    const target = new Date(dateStr)
    const now = new Date()
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  async function handleGraduateToBacklog(id: string) {
    await setBacklogStatus(id, 'backlog')
    setItems(items.map((i) => i.id === id ? { ...i, status: 'backlog' as BacklogStatus, watch_until: null } : i))
  }

  async function handleMoveToWatching(id: string) {
    const watchUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await setBacklogStatus(id, 'watching', { watchUntil })
    setItems(items.map((i) => i.id === id ? { ...i, status: 'watching' as BacklogStatus, watch_until: watchUntil } : i))
  }

  async function handleExtendWatch(id: string) {
    const watchUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await updateBacklogItem(id, { watch_until: watchUntil })
    setItems(items.map((i) => i.id === id ? { ...i, watch_until: watchUntil } : i))
  }

  async function handleReconsider(id: string) {
    await setBacklogStatus(id, 'backlog')
    setItems(items.map((i) => i.id === id ? { ...i, status: 'backlog' as BacklogStatus } : i))
  }

  async function handleDecline() {
    if (!declineModal || !declineReason.trim()) return
    await declineBacklogItem(declineModal, declineReason)
    setItems(items.map((i) => i.id === declineModal ? {
      ...i, status: 'declined' as BacklogStatus, declined_reason: declineReason, declined_at: new Date()
    } : i))
    setDeclineModal(null)
    setDeclineReason('')
  }

  async function handlePromote() {
    if (!promoteModal) return
    setPromoting(true)
    await promoteBacklogToRoadmap(
      promoteModal,
      promoteForm.column,
      promoteForm.criterion,
      promoteForm.strategicLevelId,
    )
    setItems(items.map((i) => i.id === promoteModal ? { ...i, status: 'promoted' as BacklogStatus, promoted_at: new Date() } : i))
    setPromoteModal(null)
    setPromoting(false)
  }

  const areas = Array.from(new Set(items.map((i) => i.strategic_area)))

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'In backlog', value: counts.backlog, color: '#3C3489' },
          { label: 'Watching', value: counts.watching, color: '#92400E' },
          { label: 'Promoted', value: counts.promoted, color: '#085041' },
          { label: 'Declined', value: counts.declined, color: '#888' },
        ].map((stat) => (
          <div key={stat.label} className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[11px] text-neutral-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'watching', 'backlog', 'promoted', 'declined'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
          </button>
        ))}
        <span className="text-neutral-200 mx-1">|</span>
        <button
          onClick={() => setAreaFilter('all')}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
            areaFilter === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          All areas
        </button>
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setAreaFilter(areaFilter === area ? 'all' : area)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              areaFilter === area
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Backlog items */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const statusCfg = STATUS_CONFIG[item.status]
          const days = daysUntil(item.watch_until)
          const overdue = days !== null && days <= 0

          return (
            <div key={item.id} className="border border-neutral-200 rounded-lg p-4">
              {/* Top row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ color: AREA_COLORS[item.strategic_area] ?? '#888', backgroundColor: (AREA_COLORS[item.strategic_area] ?? '#888') + '18' }}
                >
                  {item.strategic_area}
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                >
                  {statusCfg.label}
                </span>
                {item.status === 'watching' && days !== null && (
                  <span className={`text-[10px] font-medium ${overdue ? 'text-amber-600' : 'text-neutral-400'}`}>
                    {overdue ? `Overdue — reassess now` : `Reassess in ${days}d`}
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 ml-auto">
                  {item.submission_count} submission{item.submission_count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-medium text-neutral-800 mb-1">{item.title}</h3>

              {/* Description */}
              <p className="text-[13px] text-neutral-500 line-clamp-2 mb-2">{item.description}</p>

              {/* Priority signal */}
              {item.priority_signal && (
                <p className="text-[12px] italic text-green-600 mb-2">
                  &#10022; {item.priority_signal}
                </p>
              )}

              {/* Representative quote */}
              {item.representative_quote && (
                <blockquote className="text-[12px] text-neutral-400 italic border-l-2 border-neutral-200 pl-3 mb-2">
                  &ldquo;{item.representative_quote}&rdquo;
                </blockquote>
              )}

              {/* Bottom row */}
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-3">
                {item.research_candidate_count > 0 && (
                  <span>{item.research_candidate_count} research candidate{item.research_candidate_count !== 1 ? 's' : ''}</span>
                )}
                {item.cluster_label && (
                  <span>Cluster: {item.cluster_label}</span>
                )}
                <span className="ml-auto">Updated {timeAgo(item.updated_at)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                {item.status === 'watching' && (
                  <>
                    <button
                      onClick={() => handleGraduateToBacklog(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      Graduate to backlog
                    </button>
                    <button
                      onClick={() => setDeclineModal(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleExtendWatch(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                    >
                      Extend 30 days
                    </button>
                  </>
                )}
                {item.status === 'backlog' && (
                  <>
                    <button
                      onClick={() => setPromoteModal(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      Promote to roadmap
                    </button>
                    <button
                      onClick={() => handleMoveToWatching(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      Move to watching
                    </button>
                    <button
                      onClick={() => setDeclineModal(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
                {item.status === 'promoted' && item.initiative_title && (
                  <a
                    href="/"
                    className="text-[11px] font-medium text-green-700 hover:text-green-800"
                  >
                    View on roadmap: {item.initiative_title} &rarr;
                  </a>
                )}
                {item.status === 'declined' && (
                  <>
                    <button
                      onClick={() => handleReconsider(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                    >
                      Reconsider
                    </button>
                    {item.declined_reason && (
                      <span className="text-[11px] text-neutral-400 italic ml-2">
                        Reason: {item.declined_reason}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-neutral-400 text-center py-12">
            No items in the backlog yet. Graduate clusters from the Clusters tab to start building the backlog.
          </p>
        )}
      </div>

      {/* Promote modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 w-full max-w-md">
            <h3 className="text-[16px] font-semibold text-neutral-800 mb-4">Promote to roadmap</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Column</label>
                <select
                  value={promoteForm.column}
                  onChange={(e) => setPromoteForm((f) => ({ ...f, column: e.target.value }))}
                  className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
                >
                  <option value="now">Now</option>
                  <option value="next">Next</option>
                  <option value="later">Later</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Criterion</label>
                <select
                  value={promoteForm.criterion}
                  onChange={(e) => setPromoteForm((f) => ({ ...f, criterion: e.target.value }))}
                  className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
                >
                  {CRITERIA.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic level</label>
                <select
                  value={promoteForm.strategicLevelId}
                  onChange={(e) => setPromoteForm((f) => ({ ...f, strategicLevelId: e.target.value }))}
                  className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
                >
                  {strategicLevels.map((sl) => (
                    <option key={sl.id} value={sl.id}>{sl.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setPromoteModal(null)}
                className="text-[12px] font-medium px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="text-[12px] font-medium px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {promoting ? 'Promoting...' : 'Promote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 w-full max-w-md">
            <h3 className="text-[16px] font-semibold text-neutral-800 mb-2">Decline this item</h3>
            <p className="text-[12px] text-neutral-500 mb-4">
              This will be shared with users who submitted feedback on this topic.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Why are we not pursuing this?"
              rows={3}
              className="w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setDeclineModal(null); setDeclineReason('') }}
                className="text-[12px] font-medium px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim()}
                className="text-[12px] font-medium px-4 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              >
                Decline and notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
