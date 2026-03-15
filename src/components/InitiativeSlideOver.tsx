'use client'

import { useState, useRef, useEffect } from 'react'
import { CRITERION_CONFIG, COLUMNS, EFFORT_CONFIG, MONTHS_2026, MONTH_SHORT } from '@/lib/constants'
import { getLinkedRequest, pushToLinear, pullFromLinear, unlinkFromLinear, getLinearSyncLog } from '@/app/actions'
import type { Initiative, StrategicLevel, FeatureRequest, Criterion, Column, LinearSyncLogEntry } from '@/types'

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
  }) => void
  onDelete: () => void
  onClose: () => void
}

export default function InitiativeSlideOver({ initiative, strategicLevels, onSave, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState(false)
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

  const [form, setForm] = useState({
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
  })

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

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

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  function handleSubmit() {
    if (!form.title.trim()) return
    onSave({
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
    })
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

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-40 bg-black/30"
      onClick={handleBackdropClick}
    >
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[14px] font-semibold text-neutral-800">
            {editing ? 'Edit initiative' : 'Initiative detail'}
          </h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[12px] font-medium px-3 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-[18px] leading-none">
              &times;
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {editing ? (
            /* ─── Edit mode ─── */
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Title</label>
                <input
                  className="mt-1 w-full text-[14px] font-medium border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Subtitle / description</label>
                <textarea
                  className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 resize-none"
                  rows={3}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic level</label>
                  <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.strategic_level_id} onChange={(e) => setForm({ ...form, strategic_level_id: e.target.value })}>
                    <option value="">None</option>
                    {strategicLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Column</label>
                  <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })}>
                    {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Primary criterion</label>
                  <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.criterion} onChange={(e) => setForm({ ...form, criterion: e.target.value as Criterion })}>
                    {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Secondary criterion</label>
                  <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.criterion_secondary} onChange={(e) => setForm({ ...form, criterion_secondary: e.target.value })}>
                    <option value="">None</option>
                    {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Effort estimate</label>
                  <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.effort} onChange={(e) => setForm({ ...form, effort: e.target.value })}>
                    <option value="">None</option>
                    {Object.entries(EFFORT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <p className="text-[10px] text-neutral-400 mt-0.5">XS = hours, S = days, M = 1–2 weeks, L = 3–4 weeks, XL = 4+ weeks.</p>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Dependency note</label>
                  <input className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500" value={form.dep_note} onChange={(e) => setForm({ ...form, dep_note: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Target month</label>
                <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={form.target_month} onChange={(e) => setForm({ ...form, target_month: e.target.value })}>
                  <option value="">None</option>
                  {MONTHS_2026.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {(() => {
                  if (!form.target_month) return null
                  const month = parseInt(form.target_month.split('-')[1])
                  const colQuarters: Record<string, number[]> = {
                    now: [1,2,3,4,5,6], next: [4,5,6,7,8,9],
                    later: [7,8,9,10,11,12], parked: [],
                  }
                  const allowed = colQuarters[form.column] ?? []
                  if (form.column === 'parked') {
                    return <p className="text-[10px] text-amber-600 mt-1">Parked items typically don't have a target month.</p>
                  }
                  if (allowed.length > 0 && !allowed.includes(month)) {
                    const colLabel = COLUMNS.find((c) => c.id === form.column)?.label ?? form.column
                    return <p className="text-[10px] text-amber-600 mt-1">This month falls outside the typical range for the {colLabel} column.</p>
                  }
                  return null
                })()}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Visible on public roadmap</label>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Public items are visible to anyone with the link at /public.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_public: !form.is_public })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.is_public ? 'bg-green-500' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_public ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <button onClick={onDelete} className="text-[12px] text-red-500 hover:text-red-700">Delete initiative</button>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50">Cancel</button>
                  <button onClick={handleSubmit} disabled={!form.title.trim()} className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40">Save</button>
                </div>
              </div>
            </div>
          ) : (
            /* ─── Read mode ─── */
            <div>
              {/* Overview */}
              <section>
                <h1 className="text-[20px] font-semibold text-neutral-800 leading-tight">{initiative.title}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-3">
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
                  <p className="text-[12px] text-neutral-400">Loading…</p>
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
                </dl>
              </section>

              <hr className="my-5" style={{ borderColor: '#f0f0f0' }} />

              {/* Linear */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Linear</div>
                  {linearLinked && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
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
                        {linearPushing ? 'Pushing…' : 'Push to Linear'}
                      </button>
                    </div>
                    {linearError && (
                      <p className="text-[11px] text-red-500 mt-2">{linearError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Project link */}
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-400">Project</span>
                      {linearUrl ? (
                        <a href={linearUrl} target="_blank" rel="noopener noreferrer" className="text-[#5E6AD2] hover:underline flex items-center gap-1">
                          {initiative.title}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-neutral-600">Linked</span>
                      )}
                    </div>

                    {/* Linear state */}
                    {linearState && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-neutral-400">Linear state</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {linearState}
                        </span>
                      </div>
                    )}

                    {/* Last synced */}
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-400">Last synced</span>
                      <span className="text-neutral-600" title={linearSyncedAt ? new Date(linearSyncedAt).toLocaleString() : ''}>
                        {linearSyncedAt ? timeAgo(new Date(linearSyncedAt)) : '—'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
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
                        {linearPushing ? 'Pushing…' : 'Push changes'}
                      </button>
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
                        {linearPulling ? 'Pulling…' : 'Pull from Linear'}
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
