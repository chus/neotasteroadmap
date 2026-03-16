'use client'

import { useState } from 'react'
import { voteOnRequest, dismissTriage, applyTriageSuggestions } from '@/app/actions'
import CommentThread from './CommentThread'
import type { FeatureRequest, RequestStatus } from '@/types'

const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  open:         { bg: '#F1F1F1', text: '#666', label: 'Open' },
  under_review: { bg: '#E6F1FB', text: '#0C447C', label: 'Under review' },
  planned:      { bg: '#EEEDFE', text: '#3C3489', label: 'Planned' },
  declined:     { bg: '#FEE9E9', text: '#9B1C1C', label: 'Declined' },
  promoted:     { bg: '#E1F5EE', text: '#085041', label: 'Promoted' },
}

const EVIDENCE_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  strong:   { bg: '#E1F5EE', dot: '#1D9E75', label: 'Strong evidence' },
  moderate: { bg: '#FFF8E6', dot: '#BA7517', label: 'Moderate evidence' },
  weak:     { bg: '#FEE9E9', dot: '#D85A30', label: 'Weak evidence' },
}

const CRITERION_LABELS: Record<string, string> = {
  execution_ready: 'Execution ready',
  foundation: 'Foundation work',
  dependency: 'Team dependency',
  research: 'Research needed',
  parked: 'Parked',
}

const COLUMN_LABELS: Record<string, string> = {
  now: 'Now (Q1-Q2)',
  next: 'Next (Q2-Q3)',
  later: 'Later (Q3-Q4)',
  parked: 'Parked',
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

interface TriageData {
  suggested_strategic_level: string | null
  suggested_criterion: string
  suggested_column: string
  evidence_quality: 'strong' | 'moderate' | 'weak'
  evidence_note: string
  duplicate_risk: 'high' | 'medium' | 'low' | 'none'
  duplicate_of: string | null
  summary: string
  recommendation: string
}

function parseTriage(ai_triage: string | null): TriageData | null {
  if (!ai_triage) return null
  try {
    return JSON.parse(ai_triage) as TriageData
  } catch {
    return null
  }
}

interface Props {
  request: FeatureRequest
  isAdmin: boolean
  votedIds: Set<string>
  onVoted: (id: string) => void
  onPromote: (request: FeatureRequest) => void
  onRequestUpdate?: (updated: FeatureRequest) => void
  commentCount?: number
}

export default function RequestCard({ request, isAdmin, votedIds, onVoted, onPromote, onRequestUpdate, commentCount = 0 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [voteCount, setVoteCount] = useState(request.vote_count)
  const [voting, setVoting] = useState(false)
  const [applying, setApplying] = useState(false)
  const [triageJson, setTriageJson] = useState(request.ai_triage)
  const hasVoted = votedIds.has(request.id)

  const statusConfig = STATUS_COLORS[request.status]
  const triage = parseTriage(triageJson)

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

  async function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    await dismissTriage(request.id)
    setTriageJson(null)
  }

  async function handleApply(e: React.MouseEvent) {
    e.stopPropagation()
    setApplying(true)
    const result = await applyTriageSuggestions(request.id)
    if (result?.initiativeId) {
      const updated = { ...request, status: 'promoted' as RequestStatus, roadmap_initiative_id: result.initiativeId, ai_triage: null }
      setTriageJson(null)
      onRequestUpdate?.(updated)
    }
    setApplying(false)
  }

  // Evidence quality signal for collapsed card
  const evidenceConfig = triage ? EVIDENCE_COLORS[triage.evidence_quality] : null
  const showEvidenceSignal = isAdmin && triage && triage.evidence_quality !== 'strong'

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
              {/* Evidence quality signal on collapsed card */}
              {showEvidenceSignal && !expanded && evidenceConfig && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: evidenceConfig.dot }}
                  title={evidenceConfig.label}
                />
              )}
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
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {commentCount}
              </span>
            )}
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

              {/* AI Triage Panel — admin only */}
              {isAdmin && triage && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C66DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide">
                      AI Triage
                    </span>
                  </div>

                  <p className="text-[12px] text-violet-900 mb-2">{triage.summary}</p>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {triage.suggested_strategic_level && (
                      <div>
                        <span className="text-[10px] text-violet-500 font-medium">Strategic level</span>
                        <p className="text-[11px] text-violet-800">{triage.suggested_strategic_level}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-violet-500 font-medium">Criterion</span>
                      <p className="text-[11px] text-violet-800">{CRITERION_LABELS[triage.suggested_criterion] ?? triage.suggested_criterion}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-violet-500 font-medium">Column</span>
                      <p className="text-[11px] text-violet-800">{COLUMN_LABELS[triage.suggested_column] ?? triage.suggested_column}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-violet-500 font-medium">Evidence quality</span>
                      <p className="text-[11px] text-violet-800 flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: EVIDENCE_COLORS[triage.evidence_quality]?.dot ?? '#999' }}
                        />
                        {triage.evidence_quality} — {triage.evidence_note}
                      </p>
                    </div>
                  </div>

                  {triage.duplicate_risk !== 'none' && triage.duplicate_of && (
                    <div className="mb-2">
                      <span className="text-[10px] text-violet-500 font-medium">Duplicate risk ({triage.duplicate_risk})</span>
                      <p className="text-[11px] text-violet-800">Similar to: {triage.duplicate_of}</p>
                    </div>
                  )}

                  <p className="text-[11px] italic text-violet-600 mb-3">{triage.recommendation}</p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="text-[11px] font-medium px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {applying ? 'Applying...' : 'Apply suggestions'}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="text-[11px] font-medium px-3 py-1 rounded border border-violet-300 text-violet-600 hover:bg-violet-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

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

              <CommentThread requestId={request.id} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
