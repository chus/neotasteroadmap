'use client'

import { useState } from 'react'
import { voteOnRequest } from '@/app/actions'
import type { FeatureRequest, RequestStatus } from '@/types'

const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  open:         { bg: '#F1F1F1', text: '#666', label: 'Open' },
  under_review: { bg: '#E6F1FB', text: '#0C447C', label: 'Under review' },
  planned:      { bg: '#EEEDFE', text: '#3C3489', label: 'Planned' },
  declined:     { bg: '#FEE9E9', text: '#9B1C1C', label: 'Declined' },
  promoted:     { bg: '#E1F5EE', text: '#085041', label: 'Promoted' },
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

interface Props {
  request: FeatureRequest
  isAdmin: boolean
  votedIds: Set<string>
  onVoted: (id: string) => void
  onPromote: (request: FeatureRequest) => void
}

export default function RequestCard({ request, isAdmin, votedIds, onVoted, onPromote }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [voteCount, setVoteCount] = useState(request.vote_count)
  const [voting, setVoting] = useState(false)
  const hasVoted = votedIds.has(request.id)

  const statusConfig = STATUS_COLORS[request.status]

  async function handleVote(e: React.MouseEvent) {
    e.stopPropagation()
    if (hasVoted || voting) return
    setVoting(true)
    const result = await voteOnRequest(request.id)
    if (result.alreadyVoted) {
      onVoted(request.id)
    } else {
      setVoteCount((c) => c + 1)
      onVoted(request.id)
    }
    setVoting(false)
  }

  return (
    <div
      className="border border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
          <button
            onClick={handleVote}
            disabled={hasVoted}
            className={`text-[16px] leading-none transition-colors ${
              hasVoted
                ? 'text-neutral-300 cursor-default'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title={hasVoted ? "You've already voted" : 'Upvote'}
          >
            ▲
          </button>
          <span className="text-[14px] font-semibold text-neutral-700">{voteCount}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-medium text-neutral-800 leading-tight">
              {request.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {request.status === 'promoted' && request.roadmap_initiative_id && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                  Added to roadmap
                </span>
              )}
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-neutral-500">
              {request.submitter_name}
              {request.submitter_role && ` · ${request.submitter_role}`}
            </span>
            <span className="text-[11px] text-neutral-400">
              {timeAgo(request.created_at)}
            </span>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3 text-[12px] text-neutral-600 border-t border-neutral-100 pt-3">
              <div>
                <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">Problem</div>
                <p>{request.customer_problem}</p>
              </div>
              <div>
                <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">Current behaviour</div>
                <p>{request.current_behaviour}</p>
              </div>
              <div>
                <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">Desired outcome</div>
                <p>{request.desired_outcome}</p>
              </div>
              <div>
                <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">Success metric</div>
                <p>{request.success_metric}</p>
              </div>
              <div>
                <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">Evidence</div>
                <p>{request.customer_evidence}</p>
              </div>

              {request.admin_note && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-2">
                  <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-0.5">
                    Product team response
                  </div>
                  <p className="text-[12px] text-neutral-700">{request.admin_note}</p>
                </div>
              )}

              {isAdmin && request.status !== 'promoted' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPromote(request) }}
                  className="text-[11px] font-medium px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 mt-2"
                >
                  Promote to roadmap
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
