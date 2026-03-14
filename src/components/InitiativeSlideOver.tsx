'use client'

import { useState, useRef, useEffect } from 'react'
import { CRITERION_CONFIG, COLUMNS } from '@/lib/constants'
import { getLinkedRequest } from '@/app/actions'
import type { Initiative, StrategicLevel, FeatureRequest, Criterion, Column } from '@/types'

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

  const [form, setForm] = useState({
    title: initiative.title,
    subtitle: initiative.subtitle,
    strategic_level_id: initiative.strategic_level_id ?? '',
    criterion: initiative.criterion,
    criterion_secondary: initiative.criterion_secondary ?? ('' as string),
    dep_note: initiative.dep_note,
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
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Dependency note</label>
                <input className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500" value={form.dep_note} onChange={(e) => setForm({ ...form, dep_note: e.target.value })} />
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
