'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import InitiativeCard from './InitiativeCard'
import { createInitiative } from '@/app/actions'
import { CRITERION_CONFIG, TRACK_LABELS } from '@/lib/constants'
import type { Initiative, Column, Track, Criterion } from '@/types'

interface Props {
  columnId: Column
  label: string
  sublabel: string
  initiatives: Initiative[]
  activeFilter: Track | null
  onUpdate: (updated: Initiative) => void
  onDelete: (id: string) => void
  onCreate: (initiative: Initiative) => void
}

export default function BoardColumn({
  columnId,
  label,
  sublabel,
  initiatives,
  activeFilter,
  onUpdate,
  onDelete,
  onCreate,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    track: 'discovery' as Track,
    criterion: 'execution_ready' as Criterion,
    dep_note: '',
  })

  const { setNodeRef } = useDroppable({ id: columnId })

  const isParked = columnId === 'parked'

  async function handleAdd() {
    if (!form.title.trim()) return
    const newInitiative = await createInitiative({
      ...form,
      column: columnId,
      position: initiatives.length,
    })
    onCreate(newInitiative)
    setForm({ title: '', subtitle: '', track: 'discovery', criterion: 'execution_ready', dep_note: '' })
    setAdding(false)
  }

  return (
    <div
      className={`flex flex-col min-h-0 ${isParked ? 'border-dashed border-2 border-neutral-300 rounded-lg p-3' : ''}`}
    >
      <div className="mb-3">
        <h2 className="text-[11px] uppercase tracking-wider font-medium text-neutral-500">
          {label}
        </h2>
        <p className="text-[11px] text-neutral-400">{sublabel}</p>
      </div>
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 min-h-[60px]">
        <SortableContext items={initiatives.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {initiatives.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              dimmed={activeFilter !== null && initiative.track !== activeFilter}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <div className="mt-2 space-y-2 border border-neutral-200 rounded-lg p-2">
          <input
            className="w-full text-[13px] border border-neutral-300 rounded px-2 py-1 outline-none focus:border-neutral-500"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title *"
            autoFocus
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
              {(Object.entries(CRITERION_CONFIG) as [Criterion, (typeof CRITERION_CONFIG)[Criterion]][]).map(([k, v]) => (
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
              onClick={handleAdd}
              className="text-[11px] font-medium px-3 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-[11px] font-medium px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full text-[11px] text-neutral-400 hover:text-neutral-600 border border-dashed border-neutral-300 rounded-lg py-1.5 hover:border-neutral-400 transition-colors"
        >
          + Add initiative
        </button>
      )}
    </div>
  )
}
