'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { CRITERION_CONFIG, COLUMNS, EFFORT_CONFIG, MONTHS_2026, MONTH_SHORT, PHASE_CONFIG } from '@/lib/constants'
import { getLinkedRequest, pushToLinear, pullFromLinear, unlinkFromLinear, getLinearSyncLog, getChildInitiatives, getReactionsForInitiative, runDriftDetection, applyLinearDrift, dismissDrift, pushAndResolveDrift } from '@/app/actions'
import ReactionBar from './ReactionBar'
import DecisionLog from './DecisionLog'
import type { Initiative, StrategicLevel, FeatureRequest, Criterion, Column, Phase, LinearSyncLogEntry, ReactionCount } from '@/types'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Props {
  initiative: Initiative
  strategicLevels: StrategicLevel[]
  onSave: (data: {
    title: string
    subtitle: string
    strategic_level_id: string | null
    criterion: Criterion
    criterion_secondary: Criterion | null
    dep_note: string
    effort?: string | null
    target_month?: string | null
    is_public?: boolean
    column?: Column
    phase?: string | null
    confidence_problem?: number | null
    confidence_solution?: number | null
  }) => Promise<void>
  onDelete: () => void
  onClose: () => void
}

function makeForm(initiative: Initiative) {
  return {
    title: initiative.title,
    subtitle: initiative.subtitle,
    strategic_level_id: initiative.strategic_level_id ?? '',
    criterion: initiative.criterion,
    criterion_secondary: initiative.criterion_secondary ?? ('' as string),
    dep_note: initiative.dep_note,
    effort: initiative.effort ?? '',
    target_month: initiative.target_month ?? '',
    is_public: initiative.is_public,
    column: initiative.column as string,
    phase: initiative.phase ?? '',
    confidence_problem: initiative.confidence_problem,
    confidence_solution: initiative.confidence_solution,
  }
}

// ─── Linear Section ───

function LinearSection({
  initiative,
  linearLinked, setLinearLinked,
  linearUrl, setLinearUrl,
  linearState, setLinearState,
  linearSyncedAt, setLinearSyncedAt,
  linearPushing, setLinearPushing,
  linearPulling, setLinearPulling,
  linearError, setLinearError,
  linearPullChanges, setLinearPullChanges,
  syncLog, setSyncLog,
  syncLogExpanded, setSyncLogExpanded,
}: {
  initiative: Initiative
  linearLinked: boolean; setLinearLinked: (v: boolean) => void
  linearUrl: string | null; setLinearUrl: (v: string | null) => void
  linearState: string | null; setLinearState: (v: string | null) => void
  linearSyncedAt: Date | null; setLinearSyncedAt: (v: Date | null) => void
  linearPushing: boolean; setLinearPushing: (v: boolean) => void
  linearPulling: boolean; setLinearPulling: (v: boolean) => void
  linearError: string | null; setLinearError: (v: string | null) => void
  linearPullChanges: string | null; setLinearPullChanges: (v: string | null) => void
  syncLog: LinearSyncLogEntry[]; setSyncLog: (v: LinearSyncLogEntry[]) => void
  syncLogExpanded: boolean; setSyncLogExpanded: (v: boolean) => void
}) {
  const [driftChecking, setDriftChecking] = useState(false)
  const [driftCheckResult, setDriftCheckResult] = useState<string | null>(null)
  const [selectedDriftFields, setSelectedDriftFields] = useState<Set<string>>(new Set())
  const [driftApplying, setDriftApplying] = useState(false)

  const hasDrift = initiative.sync_status === 'drift'
  const driftFields = hasDrift && initiative.sync_drift ? JSON.parse(initiative.sync_drift) as { field: string; label: string; roadmapValue: string; linearValue: string; severity: string }[] : []

  // Parse enriched data
  const members: string[] = initiative.linear_members ? JSON.parse(initiative.linear_members) : []
  const updates: { id: string; body: string; createdAt: string; authorName: string; health: string | null }[] =
    initiative.linear_updates ? JSON.parse(initiative.linear_updates) : []
  const milestone: { name: string; targetDate: string } | null =
    initiative.linear_milestone ? JSON.parse(initiative.linear_milestone) : null

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#5E6AD2' }}>L</div>
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Linear</span>
        {linearLinked && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={hasDrift
              ? { backgroundColor: '#FAEEDA', color: '#633806' }
              : { backgroundColor: '#E1F5EE', color: '#085041' }}
          >
            {hasDrift ? 'Drift detected' : 'Synced'}
          </span>
        )}
        {linearLinked && linearSyncedAt && (
          <span className="text-[10px] text-neutral-400 ml-auto" title={new Date(linearSyncedAt).toLocaleString()}>
            {timeAgo(new Date(linearSyncedAt))}
          </span>
        )}
      </div>

      {!linearLinked ? (
        <div>
          <p className="text-[12px] text-neutral-400 mb-3">Not linked to a Linear project.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setLinearPushing(true)
                setLinearError(null)
                const result = await pushToLinear(initiative.id)
                setLinearPushing(false)
                if (result.success) {
                  setLinearLinked(true)
                  setLinearUrl(result.linearUrl ?? null)
                  setLinearSyncedAt(new Date())
                  getLinearSyncLog(initiative.id).then(setSyncLog)
                } else {
                  setLinearError(result.error ?? 'Failed to push')
                }
              }}
              disabled={linearPushing}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              {linearPushing ? 'Pushing...' : 'Push to Linear'}
            </button>
          </div>
          {linearError && (
            <p className="text-[11px] text-red-500 mt-2">{linearError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Project link + action buttons */}
          <div className="flex items-center justify-between">
            {linearUrl ? (
              <a href={linearUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#5E6AD2] hover:underline flex items-center gap-1">
                {initiative.title}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              <span className="text-[12px] text-neutral-600">Linked</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setLinearPulling(true)
                setLinearError(null)
                setLinearPullChanges(null)
                const result = await pullFromLinear(initiative.id)
                setLinearPulling(false)
                if (result.success) {
                  setLinearSyncedAt(new Date())
                  setLinearPullChanges(result.changes ?? null)
                  getLinearSyncLog(initiative.id).then(setSyncLog)
                } else {
                  setLinearError(result.error ?? 'Pull failed')
                }
              }}
              disabled={linearPulling}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              {linearPulling ? 'Pulling...' : 'Pull latest'}
            </button>
            <button
              onClick={async () => {
                setLinearPushing(true)
                setLinearError(null)
                const result = await pushToLinear(initiative.id)
                setLinearPushing(false)
                if (result.success) {
                  setLinearSyncedAt(new Date())
                  getLinearSyncLog(initiative.id).then(setSyncLog)
                } else {
                  setLinearError(result.error ?? 'Push failed')
                }
              }}
              disabled={linearPushing}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              {linearPushing ? 'Pushing...' : 'Push changes'}
            </button>
            <button
              onClick={async () => {
                if (!confirm('Unlink this initiative from Linear? The Linear project will not be deleted.')) return
                await unlinkFromLinear(initiative.id)
                setLinearLinked(false)
                setLinearUrl(null)
                setLinearState(null)
                setLinearSyncedAt(null)
                setSyncLog([])
              }}
              className="text-[11px] text-red-500 hover:text-red-700 ml-auto"
            >
              Unlink
            </button>
          </div>

          {linearPullChanges && (
            <p className="text-[11px] text-neutral-400 italic">{linearPullChanges}</p>
          )}
          {linearError && (
            <p className="text-[11px] text-red-500">{linearError}</p>
          )}

          {/* Drift panel */}
          {hasDrift && driftFields.length > 0 && (
            <div className="border border-amber-300 rounded-lg p-3 bg-amber-50/50">
              <div className="text-[11px] font-medium text-amber-800 mb-2">
                Linear state differs from roadmap
              </div>
              <div className="space-y-1.5 mb-3">
                {driftFields.map((df) => (
                  <label key={df.field} className="flex items-start gap-2 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDriftFields.has(df.field)}
                      onChange={(e) => {
                        const next = new Set(selectedDriftFields)
                        if (e.target.checked) next.add(df.field)
                        else next.delete(df.field)
                        setSelectedDriftFields(next)
                      }}
                      className="mt-0.5 accent-[#50E88A]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: df.severity === 'high' ? '#E24B4A' : df.severity === 'medium' ? '#EF9F27' : '#999' }}
                        />
                        <span className="font-medium text-neutral-700">{df.label}</span>
                      </div>
                      <div className="text-neutral-500 mt-0.5">
                        <span className="line-through">{df.roadmapValue}</span>
                        {' → '}
                        <span className="text-neutral-700">{df.linearValue}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    if (selectedDriftFields.size === 0) return
                    setDriftApplying(true)
                    await applyLinearDrift(initiative.id, [...selectedDriftFields])
                    setDriftApplying(false)
                    setSelectedDriftFields(new Set())
                    getLinearSyncLog(initiative.id).then(setSyncLog)
                  }}
                  disabled={selectedDriftFields.size === 0 || driftApplying}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                >
                  {driftApplying ? 'Applying...' : `Apply selected (${selectedDriftFields.size})`}
                </button>
                <button
                  onClick={async () => {
                    setDriftApplying(true)
                    await pushAndResolveDrift(initiative.id)
                    setDriftApplying(false)
                    getLinearSyncLog(initiative.id).then(setSyncLog)
                  }}
                  disabled={driftApplying}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
                >
                  Push roadmap → Linear
                </button>
                <button
                  onClick={async () => {
                    await dismissDrift(initiative.id)
                  }}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {initiative.linear_progress != null && (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-neutral-400">Progress</span>
                <span className="text-neutral-600 font-medium">{initiative.linear_progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${initiative.linear_progress}%`,
                    backgroundColor: initiative.linear_progress >= 70 ? '#1D9E75' : initiative.linear_progress >= 30 ? '#EF9F27' : '#E24B4A',
                  }}
                />
              </div>
              {(initiative.linear_issue_count != null || initiative.linear_in_progress_issue_count != null) && (
                <p className="text-[10px] text-neutral-400 mt-1">
                  {[
                    initiative.linear_issue_count != null ? `${initiative.linear_issue_count} issues` : null,
                    initiative.linear_completed_issue_count != null ? `${initiative.linear_completed_issue_count} done` : null,
                    initiative.linear_in_progress_issue_count != null ? `${initiative.linear_in_progress_issue_count} in progress` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Team */}
          {(initiative.linear_lead || members.length > 0) && (
            <div>
              <div className="text-[10px] text-neutral-400 mb-1.5">Team</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {initiative.linear_lead && (
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-[#5E6AD2] text-white text-[9px] font-medium flex items-center justify-center">
                      {initiative.linear_lead.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <span className="text-neutral-600">{initiative.linear_lead}</span>
                    <span className="text-[9px] text-neutral-400">(lead)</span>
                  </span>
                )}
                {members.filter((m) => m !== initiative.linear_lead).map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-neutral-300 text-white text-[9px] font-medium flex items-center justify-center">
                      {m.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <span className="text-neutral-500">{m}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {(initiative.linear_start_date || initiative.linear_target_date) && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-neutral-400">Timeline</span>
              <span className="text-neutral-600">
                {initiative.linear_start_date ? new Date(initiative.linear_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                {' → '}
                {initiative.linear_target_date ? new Date(initiative.linear_target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
              </span>
              {milestone && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                  {milestone.name}
                </span>
              )}
            </div>
          )}

          {/* Project updates */}
          {updates.length > 0 && (
            <div>
              <div className="text-[10px] text-neutral-400 mb-1.5">Recent updates</div>
              <div className="space-y-2">
                {updates.slice(0, 3).map((u) => (
                  <div key={u.id} className="text-[11px] border-l-2 border-neutral-200 pl-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-neutral-600 font-medium">{u.authorName}</span>
                      {u.health && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: u.health === 'onTrack' ? '#1D9E75' : u.health === 'atRisk' ? '#EF9F27' : '#E24B4A' }}
                          title={u.health}
                        />
                      )}
                      <span className="text-neutral-400">{timeAgo(new Date(u.createdAt))}</span>
                    </div>
                    <p className="text-neutral-500 line-clamp-2">{u.body}</p>
                  </div>
                ))}
              </div>
              {linearUrl && (
                <a href={linearUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#5E6AD2] hover:underline mt-1.5 inline-block">
                  View all in Linear →
                </a>
              )}
            </div>
          )}

          {/* Manual drift check */}
          <div className="pt-2">
            <button
              onClick={async () => {
                setDriftChecking(true)
                setDriftCheckResult(null)
                const result = await runDriftDetection(initiative.id)
                setDriftChecking(false)
                setDriftCheckResult(result.drifted > 0 ? 'Drift detected — refresh to see details' : 'No drift found')
              }}
              disabled={driftChecking}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 disabled:opacity-40"
            >
              {driftChecking ? 'Checking...' : 'Check for drift now'}
            </button>
            {driftCheckResult && (
              <span className="text-[10px] text-neutral-400 ml-2">{driftCheckResult}</span>
            )}
          </div>

          {/* Sync log */}
          {syncLog.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5">Sync history</div>
              <div className="space-y-1">
                {(syncLogExpanded ? syncLog : syncLog.slice(0, 3)).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                    <span>{entry.direction === 'push' ? '↑' : '↓'}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-neutral-500 truncate flex-1">
                      {entry.changes || entry.error_message || entry.direction}
                    </span>
                    <span className="text-neutral-400 shrink-0">{timeAgo(new Date(entry.created_at))}</span>
                  </div>
                ))}
              </div>
              {syncLog.length > 3 && !syncLogExpanded && (
                <button onClick={() => setSyncLogExpanded(true)} className="text-[10px] text-neutral-400 hover:text-neutral-600 mt-1">
                  View all ({syncLog.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function InitiativeSlideOver({ initiative, strategicLevels, onSave, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [linkedRequest, setLinkedRequest] = useState<FeatureRequest | null>(null)
  const [loadingLink, setLoadingLink] = useState(true)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Linear state
  const [linearLinked, setLinearLinked] = useState(!!initiative.linear_project_id)
  const [linearUrl, setLinearUrl] = useState(initiative.linear_url)
  const [linearState, setLinearState] = useState(initiative.linear_state)
  const [linearSyncedAt, setLinearSyncedAt] = useState(initiative.linear_synced_at)
  const [linearPushing, setLinearPushing] = useState(false)
  const [linearPulling, setLinearPulling] = useState(false)
  const [linearError, setLinearError] = useState<string | null>(null)
  const [linearPullChanges, setLinearPullChanges] = useState<string | null>(null)
  const [syncLog, setSyncLog] = useState<LinearSyncLogEntry[]>([])
  const [syncLogExpanded, setSyncLogExpanded] = useState(false)
  const [children, setChildren] = useState<Initiative[]>([])
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [reactions, setReactions] = useState<ReactionCount[]>([])
  const [reactionsLoading, setReactionsLoading] = useState(true)

  const initialForm = useMemo(() => makeForm(initiative), [initiative])
  const [form, setForm] = useState(initialForm)

  // Reset form when a different initiative is opened, or after save updates the data
  useEffect(() => {
    setForm(makeForm(initiative))
    setEditing(false)
    setSaveError(null)
  }, [initiative.id])

  // Also sync form when initiative data changes (e.g. after save)
  useEffect(() => {
    if (!editing) {
      setForm(makeForm(initiative))
    }
  }, [initiative, editing])

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm)
  }, [form, initialForm])

  const handleClose = useCallback(() => {
    if (editing && isDirty) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return
    }
    onClose()
  }, [editing, isDirty, onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleClose])

  useEffect(() => {
    getLinkedRequest(initiative.id)
      .then(setLinkedRequest)
      .finally(() => setLoadingLink(false))
  }, [initiative.id])

  useEffect(() => {
    if (linearLinked) {
      getLinearSyncLog(initiative.id).then(setSyncLog)
    }
  }, [initiative.id, linearLinked])

  useEffect(() => {
    if (initiative.is_parent) {
      setChildrenLoading(true)
      getChildInitiatives(initiative.id)
        .then(setChildren)
        .finally(() => setChildrenLoading(false))
    }
  }, [initiative.id, initiative.is_parent])

  useEffect(() => {
    setReactionsLoading(true)
    getReactionsForInitiative(initiative.id)
      .then(setReactions)
      .finally(() => setReactionsLoading(false))
  }, [initiative.id])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose()
  }

  function handleCancel() {
    setForm(makeForm(initiative))
    setSaveError(null)
    setEditing(false)
  }

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        title: form.title,
        subtitle: form.subtitle,
        strategic_level_id: form.strategic_level_id || null,
        criterion: form.criterion,
        criterion_secondary: form.criterion_secondary ? (form.criterion_secondary as Criterion) : null,
        dep_note: form.dep_note,
        effort: form.effort || null,
        target_month: form.target_month || null,
        is_public: form.is_public,
        column: form.column as Column,
        ...(initiative.is_parent ? { phase: form.phase || null } : {}),
        confidence_problem: form.confidence_problem,
        confidence_solution: form.confidence_solution,
      })
      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setEditing(false)
      }, 1200)
    } catch {
      setSaving(false)
      setSaveError('Failed to save — please try again')
    }
  }

  const config = CRITERION_CONFIG[initiative.criterion]
  const secondaryConfig = initiative.criterion_secondary ? CRITERION_CONFIG[initiative.criterion_secondary] : null
  const columnLabel = COLUMNS.find((c) => c.id === initiative.column)?.label ?? initiative.column
  const columnSublabel = COLUMNS.find((c) => c.id === initiative.column)?.sublabel ?? ''

  const RATIONALE: Record<string, string> = {
    execution_ready: 'This initiative is execution-ready — the team can start building immediately with no outstanding blockers.',
    foundation: 'This is foundation work — it provides infrastructure or capabilities that other initiatives depend on.',
    dependency: 'This initiative has a team dependency — it requires coordination with or delivery from another team.',
    research: 'Research is still needed — there are open questions about feasibility, approach, or user need.',
    parked: 'This initiative is parked — it has been deprioritized or deferred for now.',
  }

  const inputClass = 'mt-1 w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white'
  const selectClass = 'mt-1 w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white'
  const labelClass = 'text-[10px] font-medium text-neutral-400 uppercase tracking-wide'

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 top-[52px] z-40 bg-black/25"
      onClick={handleBackdropClick}
    >
      <div className="fixed top-[52px] right-0 bottom-0 w-full max-w-[480px] bg-white shadow-xl flex flex-col overflow-hidden animate-slide-in sm:max-w-[480px] max-sm:max-w-full">
        {/* Header — never scrolls */}
        <div className="shrink-0 bg-white border-b border-neutral-100 px-5 py-4 flex items-start justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-neutral-800 flex-1 break-words">
            {editing ? 'Edit initiative' : initiative.title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.title.trim() || saving}
                  className="text-[12px] font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: saved ? '#10B981' : '#0D2818' }}
                >
                  {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-[12px] font-semibold px-4 py-1.5 rounded-lg text-white"
                style={{ backgroundColor: '#0D2818' }}
              >
                Edit
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 text-[16px] shrink-0"
              title="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {editing ? (
            /* ─── Edit mode ─── */
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={`${inputClass} !text-[18px] font-semibold`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={3}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>

              {/* Sequencing */}
              <div>
                <div className={`${labelClass} mb-2`}>Sequencing</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                      Strategic level
                      {(() => {
                        const sel = strategicLevels.find((l) => l.id === form.strategic_level_id)
                        return sel ? <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: sel.color }} /> : null
                      })()}
                    </label>
                    <select className={selectClass} value={form.strategic_level_id} onChange={(e) => setForm({ ...form, strategic_level_id: e.target.value })}>
                      <option value="">None</option>
                      {strategicLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Column</label>
                    <select className={selectClass} value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })}>
                      {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label} ({c.sublabel})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Primary criterion</label>
                    <select className={selectClass} value={form.criterion} onChange={(e) => setForm({ ...form, criterion: e.target.value as Criterion })}>
                      {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Secondary criterion</label>
                    <select className={selectClass} value={form.criterion_secondary} onChange={(e) => setForm({ ...form, criterion_secondary: e.target.value })}>
                      <option value="">None</option>
                      {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timing & Effort */}
              <div>
                <div className={`${labelClass} mb-2`}>Timing & effort</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400">Effort estimate</label>
                    <select className={selectClass} value={form.effort} onChange={(e) => setForm({ ...form, effort: e.target.value })}>
                      <option value="">Not set</option>
                      {Object.entries(EFFORT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Target month</label>
                    <select className={selectClass} value={form.target_month} onChange={(e) => setForm({ ...form, target_month: e.target.value })}>
                      <option value="">Not set</option>
                      {MONTHS_2026.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                {(() => {
                  if (!form.target_month) return null
                  const month = parseInt(form.target_month.split('-')[1])
                  const colQuarters: Record<string, number[]> = {
                    now: [1,2,3,4,5,6], next: [4,5,6,7,8,9],
                    later: [7,8,9,10,11,12], parked: [],
                  }
                  const allowed = colQuarters[form.column] ?? []
                  if (form.column === 'parked') {
                    return <p className="text-[10px] text-amber-600 mt-1">Parked items typically don&apos;t have a target month.</p>
                  }
                  if (allowed.length > 0 && !allowed.includes(month)) {
                    const colLabel = COLUMNS.find((c) => c.id === form.column)?.label ?? form.column
                    return <p className="text-[10px] text-amber-600 mt-1">This month falls outside the typical range for the {colLabel} column.</p>
                  }
                  return null
                })()}
              </div>

              {/* Confidence */}
              <div>
                <div className={`${labelClass} mb-1`}>Confidence</div>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Rate your confidence independently. Low problem confidence = we need more research. Low solution confidence = we need a spike.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400">Problem confidence</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={form.confidence_problem ?? 3}
                        onChange={(e) => setForm({ ...form, confidence_problem: parseInt(e.target.value) })}
                        className="flex-1 accent-[#50E88A]"
                      />
                      <span className="text-[20px] font-semibold text-neutral-700 w-6 text-center">{form.confidence_problem ?? '—'}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {form.confidence_problem === null ? 'Not rated' :
                       form.confidence_problem === 1 ? 'Total unknown' :
                       form.confidence_problem === 2 ? 'Anecdotal evidence' :
                       form.confidence_problem === 3 ? 'Validated pain' :
                       form.confidence_problem === 4 ? 'Strong signal' : 'Proven problem'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400">Solution confidence</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={form.confidence_solution ?? 3}
                        onChange={(e) => setForm({ ...form, confidence_solution: parseInt(e.target.value) })}
                        className="flex-1 accent-[#50E88A]"
                      />
                      <span className="text-[20px] font-semibold text-neutral-700 w-6 text-center">{form.confidence_solution ?? '—'}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {form.confidence_solution === null ? 'Not rated' :
                       form.confidence_solution === 1 ? 'No idea how' :
                       form.confidence_solution === 2 ? 'Rough direction' :
                       form.confidence_solution === 3 ? 'Viable approach' :
                       form.confidence_solution === 4 ? 'Tested approach' : 'Proven solution'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dependency note */}
              <div>
                <label className={labelClass}>Dependency note</label>
                <input
                  className={inputClass}
                  value={form.dep_note}
                  onChange={(e) => setForm({ ...form, dep_note: e.target.value })}
                  placeholder="e.g. needs pricing infra spike first"
                />
              </div>

              {/* Options */}
              <div>
                <div className={`${labelClass} mb-2`}>Options</div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-[#50E88A]"
                  />
                  <span className="text-[13px] text-neutral-700">Visible on public roadmap</span>
                </label>
              </div>

              {/* Phase (parent only) */}
              {initiative.is_parent && (
                <div>
                  <label className={labelClass}>Phase</label>
                  <select className={selectClass} value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                    <option value="">None</option>
                    {(Object.entries(PHASE_CONFIG) as [Phase, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              )}

              {/* Save error */}
              {saveError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}

              {/* Danger zone */}
              <div className="pt-3 border-t border-neutral-100">
                <button onClick={onDelete} className="text-[12px] text-red-500 hover:text-red-700 hover:underline">
                  Delete this initiative
                </button>
              </div>
            </div>
          ) : (
            /* ─── Read mode ─── */
            <div>
              {/* Badges */}
              <section>
                <div className="flex items-center gap-2 flex-wrap">
                  {initiative.strategic_level_name && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: initiative.strategic_level_color }} />
                      {initiative.strategic_level_name}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: config.badge, color: config.color }}>
                    {config.label}
                  </span>
                  {secondaryConfig && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded opacity-80" style={{ backgroundColor: secondaryConfig.badge, color: secondaryConfig.color }}>
                      {secondaryConfig.label}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {columnLabel}
                  </span>
                </div>
              </section>

              {/* Reactions */}
              {!reactionsLoading && (
                <div className="mt-4">
                  <ReactionBar initiativeId={initiative.id} initialReactions={reactions} />
                </div>
              )}

              {/* Phase stepper (parent only) */}
              {initiative.is_parent && initiative.phase && (
                <>
                  <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />
                  <section>
                    <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Phase</div>
                    <div className="flex items-center gap-0">
                      {(Object.entries(PHASE_CONFIG) as [Phase, { label: string; color: string }][]).map(([key, cfg], idx) => {
                        const isActive = key === initiative.phase
                        const phases = Object.keys(PHASE_CONFIG)
                        const currentIdx = phases.indexOf(initiative.phase!)
                        const isPast = idx < currentIdx
                        return (
                          <div key={key} className="flex items-center">
                            {idx > 0 && (
                              <div className={`w-6 h-0.5 ${isPast || isActive ? 'bg-neutral-400' : 'bg-neutral-200'}`} />
                            )}
                            <div
                              className={`text-[10px] font-medium px-2 py-1 rounded-full border ${
                                isActive
                                  ? 'text-white'
                                  : isPast
                                  ? 'text-neutral-500 border-neutral-300 bg-neutral-100'
                                  : 'text-neutral-300 border-neutral-200'
                              }`}
                              style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : undefined}
                            >
                              {cfg.label}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </>
              )}

              {/* Children section (parent only) */}
              {initiative.is_parent && (
                <>
                  <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />
                  <section>
                    <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
                      Children ({children.length})
                    </div>
                    {childrenLoading ? (
                      <p className="text-[12px] text-neutral-400">Loading...</p>
                    ) : children.length === 0 ? (
                      <p className="text-[12px] text-neutral-400 italic">No child initiatives linked yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {children.map((child) => {
                          const childCol = COLUMNS.find((c) => c.id === child.column)?.label ?? child.column
                          return (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: initiative.parent_color ?? '#5E6AD2' }}
                              />
                              <span className="text-[12px] text-neutral-700 flex-1 truncate">{child.title}</span>
                              <span className="text-[10px] text-neutral-400 shrink-0">{childCol}</span>
                              {child.effort && EFFORT_CONFIG[child.effort] && (
                                <span
                                  className="text-[9px] font-semibold px-1 py-0.5 rounded shrink-0"
                                  style={{
                                    backgroundColor: EFFORT_CONFIG[child.effort].color + '1a',
                                    color: EFFORT_CONFIG[child.effort].color,
                                  }}
                                >
                                  {EFFORT_CONFIG[child.effort].label}
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {/* Progress summary */}
                        <div className="mt-3 pt-2 border-t border-neutral-100">
                          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                            {COLUMNS.filter((c) => c.id !== 'parked').map((col) => {
                              const count = children.filter((c) => c.column === col.id).length
                              return count > 0 ? (
                                <span key={col.id}>{col.label}: {count}</span>
                              ) : null
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Description */}
              <section>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Description</div>
                <p className="text-[13px] text-neutral-600 leading-relaxed">
                  {initiative.subtitle || 'No description added.'}
                </p>
              </section>

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Sequencing rationale */}
              <section>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Why this timing</div>
                <p className="text-[13px] text-neutral-600 leading-relaxed">
                  {RATIONALE[initiative.criterion]}
                </p>
                {initiative.criterion_secondary && (
                  <p className="text-[13px] text-neutral-600 leading-relaxed mt-2">
                    {RATIONALE[initiative.criterion_secondary]}
                  </p>
                )}
                {initiative.dep_note && (
                  <div className="mt-3 bg-amber-50 border-l-2 border-amber-300 rounded-r-lg px-3 py-2.5">
                    <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-0.5">Dependency note</div>
                    <p className="text-[12px] text-amber-800">{initiative.dep_note}</p>
                  </div>
                )}
              </section>

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Linked request */}
              <section>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Linked request</div>
                {loadingLink ? (
                  <p className="text-[12px] text-neutral-400">Loading...</p>
                ) : linkedRequest ? (
                  <a href="/requests" className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:underline">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{linkedRequest.vote_count} votes</span>
                    {linkedRequest.title}
                  </a>
                ) : (
                  <p className="text-[12px] text-neutral-400 italic">No linked request</p>
                )}
              </section>

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Decision log */}
              <DecisionLog initiativeId={initiative.id} />

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Metadata */}
              <section>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Details</div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[12px]">
                  <dt className="text-neutral-400">Added</dt>
                  <dd className="text-neutral-600">
                    {new Date(initiative.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </dd>
                  <dt className="text-neutral-400">Strategic level</dt>
                  <dd className="text-neutral-600">
                    {initiative.strategic_level_name || '—'}
                  </dd>
                  <dt className="text-neutral-400">Column</dt>
                  <dd className="text-neutral-600">
                    {columnLabel}{columnSublabel ? ` (${columnSublabel})` : ''}
                  </dd>
                  <dt className="text-neutral-400">Target month</dt>
                  <dd className="text-neutral-600">
                    {initiative.target_month && MONTHS_2026.find((m) => m.value === initiative.target_month)
                      ? MONTHS_2026.find((m) => m.value === initiative.target_month)!.label
                      : '—'}
                  </dd>
                  <dt className="text-neutral-400">Effort</dt>
                  <dd className="text-neutral-600">
                    {initiative.effort && EFFORT_CONFIG[initiative.effort]
                      ? EFFORT_CONFIG[initiative.effort].label
                      : '—'}
                  </dd>
                  <dt className="text-neutral-400">Primary criterion</dt>
                  <dd className="text-neutral-600">{config.label}</dd>
                  {secondaryConfig && (
                    <>
                      <dt className="text-neutral-400">Secondary criterion</dt>
                      <dd className="text-neutral-600">{secondaryConfig.label}</dd>
                    </>
                  )}
                  <dt className="text-neutral-400">Public</dt>
                  <dd className="text-neutral-600">{initiative.is_public ? 'Yes' : 'No'}</dd>
                </dl>
              </section>

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Linear */}
              <LinearSection
                initiative={initiative}
                linearLinked={linearLinked}
                setLinearLinked={setLinearLinked}
                linearUrl={linearUrl}
                setLinearUrl={setLinearUrl}
                linearState={linearState}
                setLinearState={setLinearState}
                linearSyncedAt={linearSyncedAt}
                setLinearSyncedAt={setLinearSyncedAt}
                linearPushing={linearPushing}
                setLinearPushing={setLinearPushing}
                linearPulling={linearPulling}
                setLinearPulling={setLinearPulling}
                linearError={linearError}
                setLinearError={setLinearError}
                linearPullChanges={linearPullChanges}
                setLinearPullChanges={setLinearPullChanges}
                syncLog={syncLog}
                setSyncLog={setSyncLog}
                syncLogExpanded={syncLogExpanded}
                setSyncLogExpanded={setSyncLogExpanded}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

// Note: The panel uses fixed positioning starting at top-[52px] to sit below
// the sticky nav bar (h-[52px] z-50). The header is shrink-0 so it never
// scrolls, and the body is flex-1 overflow-y-auto for scrollable content.
