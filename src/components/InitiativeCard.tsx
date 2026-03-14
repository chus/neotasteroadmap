'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CRITERION_CONFIG, TRACK_LABELS } from '@/lib/constants'
import { updateInitiative, deleteInitiative } from '@/app/actions'
import type { Initiative, Track, Criterion } from '@/types'

interface Props {
  initiative: Initiative
  dimmed: boolean
  onUpdate: (updated: Initiative) => void
  onDelete: (id: string) => void
}

export default function InitiativeCard({ initiative, dimmed, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: initiative.title,
    subtitle: initiative.subtitle,
    track: initiative.track,
    criterion: initiative.criterion,
    dep_note: initiative.dep_note,
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: initiative.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : dimmed ? 0.25 : 1,
  }

  const config = CRITERION_CONFIG[initiative.criterion]

  async function handleSave() {
    await updateInitiative(initiative.id, form)
    onUpdate({ ...initiative, ...form })
    setEditing(false)
  }

  function handleCancel() {
    setForm({
      title: initiative.title,
      subtitle: initiative.subtitle,
      track: initiative.track,
      criterion: initiative.criterion,
      dep_note: initiative.dep_note,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this initiative?')) return
    await deleteInitiative(initiative.id)
    onDelete(initiative.id)
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg p-3 space-y-2"
        {...attributes}
      >
        <input
          className="w-full text-[13px] font-medium border border-neutral-300 rounded px-2 py-1 outline-none focus:border-neutral-500"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
        />
        <input
          className="w-full text-[12px] border border-neutral-300 rounded px-2 py-1 outline-none focus:border-neutral-500"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          placeholder="Subtitle"
        />
        <div className="flex gap-2">
          <select
            className="flex-1 text-[12px] border border-neutral-300 rounded px-2 py-1 outline-none"
            value={form.track}
            onChange={(e) => setForm({ ...form, track: e.target.value as Track })}
          >
            {(Object.entries(TRACK_LABELS) as [Track, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="flex-1 text-[12px] border border-neutral-300 rounded px-2 py-1 outline-none"
            value={form.criterion}
            onChange={(e) => setForm({ ...form, criterion: e.target.value as Criterion })}
          >
            {(Object.entries(CRITERION_CONFIG) as [Criterion, typeof config][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <input
          className="w-full text-[11px] border border-neutral-300 rounded px-2 py-1 outline-none focus:border-neutral-500"
          value={form.dep_note}
          onChange={(e) => setForm({ ...form, dep_note: e.target.value })}
          placeholder="Dependency note"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="text-[11px] font-medium px-3 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="text-[11px] font-medium px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: config.border, backgroundColor: config.bg }}
      className="group relative rounded-lg border p-3 cursor-pointer"
      onClick={() => setEditing(true)}
      {...attributes}
    >
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing px-1 text-neutral-400"
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </div>
      <button
        className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 text-[11px] leading-none"
        onClick={(e) => { e.stopPropagation(); handleDelete() }}
      >
        ✕
      </button>
      <div className="ml-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-tight" style={{ color: config.color }}>
            {initiative.title}
          </span>
        </div>
        {initiative.subtitle && (
          <p className="text-[12px] text-neutral-500 mt-0.5">{initiative.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: config.badge, color: config.color }}
          >
            {config.label}
          </span>
          <span className="text-[10px] text-neutral-400">
            {TRACK_LABELS[initiative.track]}
          </span>
        </div>
        {initiative.dep_note && (
          <p className="text-[11px] italic text-neutral-400 mt-1">{initiative.dep_note}</p>
        )}
      </div>
    </div>
  )
}
