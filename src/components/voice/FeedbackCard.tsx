'use client'

import { useState } from 'react'
import {
  updateFeedbackStatus,
  updateFeedbackNote,
  actionFeedback,
  archiveFeedback,
  retriggerTriage,
  searchInitiativesForAction,
} from '@/app/feedback-actions'
import type { FeedbackSubmission, FeedbackStatus } from '@/types'

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  new:       { label: 'New',       color: '#0C447C', bg: '#E6F1FB' },
  reviewing: { label: 'Reviewing', color: '#633806', bg: '#FAEEDA' },
  actioned:  { label: 'Actioned',  color: '#085041', bg: '#E1F5EE' },
  archived:  { label: 'Archived',  color: '#666',    bg: '#F1F1F1' },
  merged:    { label: 'Merged',    color: '#3C3489', bg: '#EEEDFE' },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  bug:        { label: 'Bug',        color: '#9B1C1C', bg: '#FEE9E9' },
  feature:    { label: 'Feature',    color: '#3C3489', bg: '#EEEDFE' },
  experience: { label: 'Experience', color: '#085041', bg: '#E1F5EE' },
  pricing:    { label: 'Pricing',    color: '#633806', bg: '#FAEEDA' },
  other:      { label: 'Other',      color: '#666',    bg: '#F1F1F1' },
}

const SENTIMENT_DOTS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
}

interface Props {
  submission: FeedbackSubmission
  onUpdate: (updated: FeedbackSubmission) => void
}

export default function FeedbackCard({ submission, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState(submission.internal_note)
  const [savingNote, setSavingNote] = useState(false)
  const [showActionSearch, setShowActionSearch] = useState(false)
  const [actionQuery, setActionQuery] = useState('')
  const [actionResults, setActionResults] = useState<{ id: string; title: string; column: string }[]>([])

  const statusCfg = STATUS_CONFIG[submission.status] ?? STATUS_CONFIG.new
  const catCfg = CATEGORY_CONFIG[submission.category] ?? CATEGORY_CONFIG.other

  let triage: { sentiment?: string; urgency?: string; themes?: string[]; quality_score?: number; summary?: string; suggested_action?: string } | null = null
  try {
    if (submission.ai_triage) triage = JSON.parse(submission.ai_triage)
  } catch {}

  function timeAgo(date: Date) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  async function handleStatusChange(status: FeedbackStatus) {
    await updateFeedbackStatus(submission.id, status)
    onUpdate({ ...submission, status, reviewed_at: new Date() })
  }

  async function handleSaveNote() {
    setSavingNote(true)
    await updateFeedbackNote(submission.id, note)
    onUpdate({ ...submission, internal_note: note })
    setSavingNote(false)
  }

  async function handleAction(initiativeId: string) {
    await actionFeedback(submission.id, initiativeId)
    onUpdate({ ...submission, status: 'actioned', actioned_initiative_id: initiativeId })
    setShowActionSearch(false)
    setActionQuery('')
  }

  async function handleArchive() {
    await archiveFeedback(submission.id)
    onUpdate({ ...submission, status: 'archived' })
  }

  async function handleRetriage() {
    await retriggerTriage(submission.id)
    // Triage runs async — the user will need to refresh to see result
  }

  async function handleActionSearch(query: string) {
    setActionQuery(query)
    if (query.trim().length > 1) {
      const results = await searchInitiativesForAction(query)
      setActionResults(results)
    } else {
      setActionResults([])
    }
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
      >
        {/* Sentiment dot */}
        {triage?.sentiment && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: SENTIMENT_DOTS[triage.sentiment] ?? '#999' }}
            title={`Sentiment: ${triage.sentiment}`}
          />
        )}

        {/* Title */}
        <span className="text-[13px] font-medium text-neutral-800 truncate flex-1">
          {submission.title}
        </span>

        {/* Badges */}
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: catCfg.bg, color: catCfg.color }}
        >
          {catCfg.label}
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
        {submission.research_opt_in && (
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Research opt-in" />
        )}
        <span className="text-[11px] text-neutral-400 shrink-0">
          {timeAgo(submission.created_at)}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-neutral-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-100 space-y-3">
          {/* Submitter info */}
          <div className="flex items-center gap-3 pt-3 text-[12px] text-neutral-500">
            <span className="font-medium text-neutral-700">{submission.name}</span>
            {submission.email && <span>{submission.email}</span>}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100">{submission.user_type}</span>
            {submission.restaurant_name && (
              <span>@ {submission.restaurant_name}</span>
            )}
          </div>

          {/* Body */}
          <p className="text-[13px] text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {submission.body}
          </p>

          {/* Context */}
          {(submission.order_context || submission.device) && (
            <div className="flex items-center gap-2">
              {submission.order_context && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                  {submission.order_context.replace('_', ' ')}
                </span>
              )}
              {submission.device && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                  {submission.device}
                </span>
              )}
            </div>
          )}

          {/* AI Triage */}
          {triage && (
            <div className="border border-neutral-100 rounded-lg p-3 bg-neutral-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">AI Triage</span>
                {triage.urgency && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    triage.urgency === 'high' ? 'bg-red-100 text-red-700' :
                    triage.urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {triage.urgency}
                  </span>
                )}
                {triage.quality_score && (
                  <span className="text-[10px] text-neutral-400">Quality: {triage.quality_score}/5</span>
                )}
              </div>
              {triage.summary && (
                <p className="text-[12px] text-neutral-600 mb-2">{triage.summary}</p>
              )}
              {triage.themes && triage.themes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {triage.themes.map((theme) => (
                    <span key={theme} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
              {triage.suggested_action && (
                <p className="text-[11px] text-neutral-500 mt-2 italic">{triage.suggested_action}</p>
              )}
            </div>
          )}

          {/* Internal note */}
          <div>
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Internal note</label>
            <div className="flex gap-2 mt-1">
              <input
                className="flex-1 text-[12px] border border-neutral-200 rounded px-2.5 py-1.5 outline-none focus:border-neutral-400"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
              />
              {note !== submission.internal_note && (
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="text-[11px] font-medium px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40"
                >
                  {savingNote ? '...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {/* Status selector */}
            <select
              value={submission.status}
              onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
              className="text-[11px] font-medium px-2 py-1 rounded border border-neutral-200 bg-white outline-none"
            >
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="actioned">Actioned</option>
              <option value="archived">Archived</option>
            </select>

            {/* Action to initiative */}
            <div className="relative">
              <button
                onClick={() => setShowActionSearch(!showActionSearch)}
                className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-600 hover:border-neutral-300"
              >
                Action &rarr; Initiative
              </button>
              {showActionSearch && (
                <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-neutral-200 rounded-lg shadow-lg z-30 p-2">
                  <input
                    type="text"
                    value={actionQuery}
                    onChange={(e) => handleActionSearch(e.target.value)}
                    placeholder="Search initiatives..."
                    className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 outline-none focus:border-neutral-400 mb-1"
                    autoFocus
                  />
                  {actionResults.length > 0 ? (
                    <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                      {actionResults.map((init) => (
                        <button
                          key={init.id}
                          onClick={() => handleAction(init.id)}
                          className="w-full text-left text-[11px] px-2 py-1.5 rounded hover:bg-neutral-50 truncate"
                        >
                          {init.title}
                          <span className="text-neutral-400 ml-1">({init.column})</span>
                        </button>
                      ))}
                    </div>
                  ) : actionQuery.trim() ? (
                    <p className="text-[11px] text-neutral-400 px-2 py-1">No matches</p>
                  ) : (
                    <p className="text-[11px] text-neutral-400 px-2 py-1">Type to search...</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleArchive}
              className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            >
              Archive
            </button>

            <button
              onClick={handleRetriage}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 px-1"
              title="Re-run AI triage"
            >
              Re-triage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
