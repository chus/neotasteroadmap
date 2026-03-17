'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { FeedbackCluster, FeedbackSubmission } from '@/types'
import {
  getClusterWithSubmissions,
  renameCluster,
  mergeCluster,
  splitCluster,
  reassignSubmission,
  archiveCluster,
  unarchiveCluster,
  updateClusterPMNotes,
  addSubmissionPMNote,
  markSubmissionReviewed,
} from '@/app/feedback-actions'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:     { label: 'Active',     color: '#0C447C', bg: '#E6F1FB' },
  resolved:   { label: 'Resolved',   color: '#085041', bg: '#E1F5EE' },
  watching:   { label: 'Watching',   color: '#633806', bg: '#FAEEDA' },
  planned:    { label: 'Planned',    color: '#3C3489', bg: '#EEEDFE' },
  monitoring: { label: 'Monitoring', color: '#633806', bg: '#FAEEDA' },
}

interface Props {
  cluster: FeedbackCluster
  allClusters: FeedbackCluster[]
  onClose: () => void
  onUpdate: () => void
}

export default function ClusterSlideOver({ cluster: initialCluster, allClusters, onClose, onUpdate }: Props) {
  const [cluster, setCluster] = useState(initialCluster)
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [splitMode, setSplitMode] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)

  // Edit form
  const [editLabel, setEditLabel] = useState(cluster.label)
  const [editDesc, setEditDesc] = useState(cluster.description)
  const [editNotes, setEditNotes] = useState(cluster.pm_notes)
  const [saving, setSaving] = useState(false)

  // Split form
  const [splitChecked, setSplitChecked] = useState<Set<string>>(new Set())
  const [splitTitle, setSplitTitle] = useState('')
  const [splitDesc, setSplitDesc] = useState('')

  // Merge
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeTarget, setMergeTarget] = useState<string | null>(null)
  const [merging, setMerging] = useState(false)

  // Inline actions
  const [noteSubId, setNoteSubId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [moveSubId, setMoveSubId] = useState<string | null>(null)

  const backdropRef = useRef<HTMLDivElement>(null)

  // Load submissions
  useEffect(() => {
    (async () => {
      setLoading(true)
      const data = await getClusterWithSubmissions(cluster.id)
      if (data) {
        setCluster(data.cluster)
        setSubmissions(data.submissions)
      }
      setLoading(false)
    })()
  }, [cluster.id])

  const handleClose = useCallback(() => {
    if (editing) {
      if (!window.confirm('Discard unsaved changes?')) return
    }
    onClose()
  }, [editing, onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose()
  }

  async function handleSaveEdit() {
    setSaving(true)
    await renameCluster(cluster.id, editLabel, editDesc)
    await updateClusterPMNotes(cluster.id, editNotes)
    setCluster({ ...cluster, label: editLabel, description: editDesc, pm_notes: editNotes })
    setSaving(false)
    setEditing(false)
    onUpdate()
  }

  async function handleArchive() {
    const reason = window.prompt('Archive reason (optional):') ?? ''
    await archiveCluster(cluster.id, reason)
    onUpdate()
    onClose()
  }

  async function handleUnarchive() {
    await unarchiveCluster(cluster.id)
    onUpdate()
    onClose()
  }

  async function handleMerge() {
    if (!mergeTarget) return
    setMerging(true)
    await mergeCluster(cluster.id, mergeTarget)
    setMerging(false)
    onUpdate()
    onClose()
  }

  async function handleSplit() {
    if (splitChecked.size === 0 || !splitTitle.trim()) return
    await splitCluster(cluster.id, Array.from(splitChecked), splitTitle, splitDesc)
    setSplitMode(false)
    setSplitChecked(new Set())
    setSplitTitle('')
    setSplitDesc('')
    onUpdate()
    onClose()
  }

  async function handleReassign(submissionId: string, targetClusterId: string) {
    await reassignSubmission(submissionId, targetClusterId)
    setMoveSubId(null)
    // Refresh
    const data = await getClusterWithSubmissions(cluster.id)
    if (data) {
      setCluster(data.cluster)
      setSubmissions(data.submissions)
    }
    onUpdate()
  }

  async function handleAddNote(submissionId: string) {
    await addSubmissionPMNote(submissionId, noteText)
    setSubmissions(subs => subs.map(s => s.id === submissionId ? { ...s, pm_note: noteText } : s))
    setNoteSubId(null)
    setNoteText('')
  }

  async function handleMarkReviewed(submissionId: string) {
    await markSubmissionReviewed(submissionId)
    setSubmissions(subs => subs.map(s => s.id === submissionId ? { ...s, reviewed: true } : s))
  }

  // Health indicators
  const qualityAvg = cluster.avg_quality_score
  const qualityColor = qualityAvg == null ? '#999' : qualityAvg >= 3.5 ? '#10B981' : qualityAvg >= 2 ? '#F59E0B' : '#EF4444'
  const researchPool = cluster.research_optin_count
  const researchColor = researchPool >= 3 ? '#10B981' : researchPool >= 1 ? '#F59E0B' : '#999'
  const lastSubDays = cluster.last_submission_at
    ? Math.floor((Date.now() - new Date(cluster.last_submission_at).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const lastSubColor = lastSubDays == null ? '#999' : lastSubDays < 7 ? '#10B981' : lastSubDays <= 30 ? '#F59E0B' : '#EF4444'

  const statusCfg = STATUS_CONFIG[cluster.status] ?? STATUS_CONFIG.active

  // Merge modal filtered clusters
  const mergeCandidates = useMemo(() =>
    allClusters.filter(c => !c.is_archived && c.id !== cluster.id && c.label.toLowerCase().includes(mergeSearch.toLowerCase())),
    [allClusters, cluster.id, mergeSearch]
  )
  const mergeTargetCluster = allClusters.find(c => c.id === mergeTarget)

  const labelClass = 'text-[10px] font-medium text-neutral-400 uppercase tracking-wide'
  const inputClass = 'w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white'

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 top-[52px] z-40 bg-black/25"
      onClick={handleBackdropClick}
    >
      <div className="fixed top-[52px] right-0 bottom-0 w-full max-w-[520px] bg-white shadow-xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-neutral-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="text-[20px] font-semibold text-neutral-800 w-full border border-neutral-200 rounded px-2 py-1 outline-none focus:border-[#50E88A]"
                />
              ) : (
                <h2 className="text-[20px] font-semibold text-neutral-800 leading-tight">
                  {cluster.label}
                </h2>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: cluster.created_by === 'manual' ? '#E6F1FB' : '#F5F5F5',
                    color: cluster.created_by === 'manual' ? '#0C447C' : '#888',
                  }}
                >
                  {cluster.created_by === 'manual' ? 'Manually created' : 'AI generated'}
                </span>
                {cluster.theme && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                    {cluster.theme}
                  </span>
                )}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
                {cluster.is_archived && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                    Archived
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); setEditLabel(cluster.label); setEditDesc(cluster.description); setEditNotes(cluster.pm_notes) }}
                    className="text-[12px] text-neutral-500 hover:text-neutral-700 px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editLabel.trim()}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-40"
                    style={{ backgroundColor: '#0D2818' }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-[12px] text-neutral-400 hover:text-neutral-600 px-2 py-1"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-[16px] text-neutral-400 hover:text-neutral-600 px-2 py-1"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Health strip */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="border border-neutral-100 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Avg quality</div>
              <div className="text-[14px] font-semibold" style={{ color: qualityColor }}>
                {qualityAvg != null ? `${qualityAvg.toFixed(1)}/5` : '—'}
              </div>
            </div>
            <div className="border border-neutral-100 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Research pool</div>
              <div className="text-[14px] font-semibold" style={{ color: researchColor }}>
                {researchPool}
              </div>
            </div>
            <div className="border border-neutral-100 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Trend</div>
              <div className="text-[14px] font-semibold text-neutral-600">
                {cluster.submission_count >= 5 ? '↑ growing' : cluster.submission_count >= 2 ? '→ stable' : '↓ low'}
              </div>
            </div>
            <div className="border border-neutral-100 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">Last submission</div>
              <div className="text-[14px] font-semibold" style={{ color: lastSubColor }}>
                {lastSubDays != null ? `${lastSubDays}d ago` : '—'}
              </div>
            </div>
          </div>

          {/* Description */}
          <section className="mb-5">
            <div className={`${labelClass} mb-2`}>What this cluster is about</div>
            {editing ? (
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                className={inputClass}
              />
            ) : (
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {cluster.description || 'No description'}
              </p>
            )}
          </section>

          {/* PM Notes */}
          {(cluster.pm_notes || editing) && (
            <section className="mb-5">
              <div className={`${labelClass} mb-2`}>PM Notes</div>
              {editing ? (
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes..."
                  className={inputClass}
                />
              ) : (
                <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
                  <p className="text-[12px] text-neutral-500 italic">{cluster.pm_notes}</p>
                </div>
              )}
            </section>
          )}

          <hr className="my-5 border-neutral-100" />

          {/* Submissions */}
          <section>
            <div className={`${labelClass} mb-3`}>
              {splitMode ? 'Select submissions for the new cluster' : `Submissions (${submissions.length})`}
            </div>
            {loading ? (
              <p className="text-[12px] text-neutral-400 py-4">Loading submissions...</p>
            ) : (
              <div className="space-y-1">
                {submissions.map((sub) => {
                  const triage = (() => { try { return JSON.parse(sub.ai_triage ?? '{}') } catch { return {} } })()
                  const qualityScore = triage.quality_score ?? null
                  const qualityDot = qualityScore == null ? '#999' : qualityScore >= 4 ? '#10B981' : qualityScore >= 2.5 ? '#F59E0B' : '#EF4444'
                  const confPct = sub.assignment_confidence != null ? Math.round(sub.assignment_confidence * 100) : null
                  const confColor = confPct == null ? null : confPct > 85 ? '#10B981' : confPct >= 55 ? '#F59E0B' : '#EF4444'
                  const summary = triage.summary || sub.title.slice(0, 60)

                  return (
                    <div key={sub.id} className="group relative flex items-start gap-2 px-3 py-2 bg-neutral-50 rounded hover:bg-neutral-100 transition-colors">
                      {splitMode && (
                        <input
                          type="checkbox"
                          checked={splitChecked.has(sub.id)}
                          onChange={() => {
                            const next = new Set(splitChecked)
                            next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id)
                            setSplitChecked(next)
                          }}
                          className="mt-1 shrink-0"
                        />
                      )}
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: qualityDot }}
                        title={qualityScore != null ? `Quality: ${qualityScore}/5` : 'No quality score'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-neutral-700 truncate">{summary}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {confPct != null && sub.assignment_method === 'ai' && (
                            <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ color: confColor!, backgroundColor: confColor + '15' }}>
                              {confPct}% match
                            </span>
                          )}
                          {sub.assignment_method === 'manual' && (
                            <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-blue-50 text-blue-600">
                              manual
                            </span>
                          )}
                          {sub.research_opt_in && (
                            <span className="text-[10px] text-green-600" title="Research opt-in">🔬</span>
                          )}
                          {sub.reviewed && (
                            <span className="text-[10px] text-green-600">✓ reviewed</span>
                          )}
                        </div>
                        {sub.pm_note && (
                          <p className="text-[11px] text-neutral-400 italic mt-1">{sub.pm_note}</p>
                        )}

                        {/* Inline note form */}
                        {noteSubId === sub.id && (
                          <div className="flex gap-1 mt-1">
                            <input
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder="Add note..."
                              className="text-[11px] border border-neutral-200 rounded px-2 py-1 flex-1 outline-none"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && handleAddNote(sub.id)}
                            />
                            <button onClick={() => handleAddNote(sub.id)} className="text-[10px] text-green-600 font-medium px-1">Save</button>
                            <button onClick={() => { setNoteSubId(null); setNoteText('') }} className="text-[10px] text-neutral-400 px-1">Cancel</button>
                          </div>
                        )}

                        {/* Move cluster selector */}
                        {moveSubId === sub.id && (
                          <div className="mt-1">
                            <select
                              className="text-[11px] border border-neutral-200 rounded px-2 py-1 w-full outline-none"
                              value=""
                              onChange={e => e.target.value && handleReassign(sub.id, e.target.value)}
                            >
                              <option value="">Move to...</option>
                              {allClusters.filter(c => !c.is_archived && c.id !== cluster.id).map(c => (
                                <option key={c.id} value={c.id}>{c.label} ({c.submission_count})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Hover actions */}
                      {!splitMode && (
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => setMoveSubId(moveSubId === sub.id ? null : sub.id)}
                            className="text-[10px] text-neutral-400 hover:text-neutral-600 px-1 py-0.5"
                            title="Move to another cluster"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => { setNoteSubId(sub.id); setNoteText(sub.pm_note || '') }}
                            className="text-[10px] text-neutral-400 hover:text-neutral-600 px-1 py-0.5"
                            title="Add note"
                          >
                            Note
                          </button>
                          {!sub.reviewed && (
                            <button
                              onClick={() => handleMarkReviewed(sub.id)}
                              className="text-[10px] text-neutral-400 hover:text-green-600 px-1 py-0.5"
                              title="Mark as reviewed"
                            >
                              Review ✓
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {submissions.length === 0 && !loading && (
                  <p className="text-[12px] text-neutral-400 italic py-2">No submissions in this cluster.</p>
                )}
              </div>
            )}
          </section>

          {/* Split form */}
          {splitMode && (
            <div className="mt-4 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
              <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wide mb-2">New cluster</div>
              <input
                value={splitTitle}
                onChange={e => setSplitTitle(e.target.value)}
                placeholder="Cluster title..."
                className="w-full text-[12px] border border-neutral-200 rounded px-2.5 py-1.5 mb-2 outline-none"
              />
              <textarea
                value={splitDesc}
                onChange={e => setSplitDesc(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full text-[12px] border border-neutral-200 rounded px-2.5 py-1.5 mb-2 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSplit}
                  disabled={splitChecked.size === 0 || !splitTitle.trim()}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  Create split ({splitChecked.size} selected)
                </button>
                <button
                  onClick={() => { setSplitMode(false); setSplitChecked(new Set()); setSplitTitle(''); setSplitDesc('') }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-700 px-2 py-1"
                >
                  Cancel split
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!editing && !splitMode && (
            <>
              <hr className="my-5 border-neutral-100" />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditing(true)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Rename
                </button>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Merge into...
                </button>
                <button
                  onClick={() => setSplitMode(true)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Split
                </button>
                {cluster.is_archived ? (
                  <button
                    onClick={handleUnarchive}
                    className="text-[11px] font-medium px-3 py-1.5 rounded border border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Unarchive
                  </button>
                ) : (
                  <button
                    onClick={handleArchive}
                    className="text-[11px] font-medium px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Archive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Merge modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setShowMergeModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h3 className="text-[15px] font-semibold text-neutral-800">
                Merge &ldquo;{cluster.label}&rdquo; into another cluster
              </h3>
              <p className="text-[12px] text-amber-600 mt-1">
                All {cluster.submission_count} submissions will be moved. This cluster will be archived.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <input
                value={mergeSearch}
                onChange={e => setMergeSearch(e.target.value)}
                placeholder="Search clusters..."
                className="w-full text-[12px] border border-neutral-200 rounded-md px-2.5 py-2 mb-3 outline-none"
              />
              <div className="space-y-1">
                {mergeCandidates.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setMergeTarget(c.id)}
                    className="w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center gap-2"
                    style={{
                      borderColor: mergeTarget === c.id ? '#10B981' : '#e5e5e5',
                      backgroundColor: mergeTarget === c.id ? '#F0FDF4' : 'white',
                    }}
                  >
                    <span className="text-[12px] font-medium text-neutral-700 flex-1 truncate">{c.label}</span>
                    <span className="text-[10px] text-neutral-400 shrink-0">{c.submission_count} subs</span>
                  </button>
                ))}
                {mergeCandidates.length === 0 && (
                  <p className="text-[12px] text-neutral-400 italic py-2">No matching clusters.</p>
                )}
              </div>
              {mergeTarget && mergeTargetCluster && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-[12px] text-green-700">
                    After merge: &ldquo;{mergeTargetCluster.label}&rdquo; will have{' '}
                    <strong>{mergeTargetCluster.submission_count + cluster.submission_count}</strong> submissions
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-neutral-100 flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowMergeModal(false)}
                className="text-[12px] text-neutral-500 hover:text-neutral-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={!mergeTarget || merging}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
              >
                {merging ? 'Merging...' : `Merge ${cluster.submission_count} submissions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
