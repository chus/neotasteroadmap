'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import RequestCard from './RequestCard'
import RequestModal from './RequestModal'
import PromoteModal from './PromoteModal'
import Toast from './Toast'
import { createFeatureRequest, promoteToRoadmap, getCommentCounts } from '@/app/actions'
import type { FeatureRequest, StrategicLevel, RequestStatus, Column, Criterion } from '@/types'

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'under_review', label: 'Under review' },
  { key: 'planned', label: 'Planned' },
  { key: 'promoted', label: 'Promoted' },
]

interface Props {
  initialRequests: FeatureRequest[]
  strategicLevels: StrategicLevel[]
  initialCommentCounts?: Record<string, number>
}

export default function RequestsFeed({ initialRequests, strategicLevels, initialCommentCounts = {} }: Props) {
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === '1'

  const [requests, setRequests] = useState<FeatureRequest[]>(initialRequests)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [promotingRequest, setPromotingRequest] = useState<FeatureRequest | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(initialCommentCounts)

  useEffect(() => {
    const stored = localStorage.getItem('voted_request_ids')
    if (stored) {
      try { setVotedIds(new Set(JSON.parse(stored))) } catch { /* ignore */ }
    }
  }, [])

  function markVoted(id: string) {
    setVotedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('voted_request_ids', JSON.stringify([...next]))
      return next
    })
  }

  async function handleSubmit(data: Parameters<typeof createFeatureRequest>[0]) {
    try {
      const newRequest = await createFeatureRequest(data)
      setRequests((prev) => [newRequest, ...prev])
      setShowModal(false)
      setToast('Request submitted successfully')
    } catch {
      setToast('Failed to submit request')
    }
  }

  async function handlePromote(data: { column: Column; criterion: Criterion; strategicLevelId: string }) {
    if (!promotingRequest) return
    try {
      await promoteToRoadmap(promotingRequest.id, data.column, data.criterion, data.strategicLevelId)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === promotingRequest.id ? { ...r, status: 'promoted' as RequestStatus } : r
        )
      )
      setPromotingRequest(null)
      setToast('Promoted to roadmap')
    } catch {
      setToast('Failed to promote')
    }
  }

  const filtered = requests
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'votes') return b.vote_count - a.vote_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="text-[13px] font-medium px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          Submit a request
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
                statusFilter === tab.key
                  ? 'border-neutral-500 bg-neutral-100 text-neutral-800'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('votes')}
            className={`text-[11px] px-2 py-0.5 rounded transition-colors ${sortBy === 'votes' ? 'text-neutral-800 font-medium' : 'text-neutral-400'}`}
          >
            Most voted
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`text-[11px] px-2 py-0.5 rounded transition-colors ${sortBy === 'recent' ? 'text-neutral-800 font-medium' : 'text-neutral-400'}`}
          >
            Most recent
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              isAdmin={isAdmin}
              votedIds={votedIds}
              onVoted={markVoted}
              onPromote={setPromotingRequest}
              onRequestUpdate={(updated) => setRequests((prev) => prev.map((req) => req.id === updated.id ? updated : req))}
              commentCount={commentCounts[r.id] ?? 0}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <span className="text-[13px] text-neutral-400">
              No requests{statusFilter !== 'all' ? ` with status "${statusFilter.replace('_', ' ')}"` : ''}.
            </span>
          </div>
        )}
      </div>

      {showModal && <RequestModal onSubmit={handleSubmit} onClose={() => setShowModal(false)} />}
      {promotingRequest && (
        <PromoteModal
          request={promotingRequest}
          strategicLevels={strategicLevels}
          onConfirm={handlePromote}
          onClose={() => setPromotingRequest(null)}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
