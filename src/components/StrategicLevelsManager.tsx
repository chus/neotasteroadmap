'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createStrategicLevel,
  updateStrategicLevel,
  deleteStrategicLevel,
  updateStrategicLevelPositions,
} from '@/app/actions'
import Toast from './Toast'
import type { StrategicLevel } from '@/types'

interface Props {
  initialLevels: StrategicLevel[]
  levelCounts: Record<string, number>
}

function SortableRow({
  level,
  count,
  onEdit,
  onDelete,
}: {
  level: StrategicLevel
  count: number
  onEdit: (level: StrategicLevel) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: level.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className="border-b border-neutral-100">
      <td className="py-3 pr-2">
        <span {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-400 text-[12px]">⠿</span>
      </td>
      <td className="py-3 pr-3">
        <span className="w-4 h-4 rounded inline-block align-middle" style={{ backgroundColor: level.color }} />
      </td>
      <td className="py-3 pr-3 text-[13px] font-medium text-neutral-800">{level.name}</td>
      <td className="py-3 pr-3 text-[12px] text-neutral-500 max-w-[200px] truncate">{level.description || '—'}</td>
      <td className="py-3 pr-3 text-[12px] text-neutral-500 text-center">{count}</td>
      <td className="py-3 text-right">
        <button onClick={() => onEdit(level)} className="text-[11px] text-neutral-400 hover:text-neutral-600 mr-3">Edit</button>
        <button
          onClick={() => onDelete(level.id)}
          disabled={count > 0}
          className="text-[11px] text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title={count > 0 ? 'Remove initiatives from this level first' : 'Delete level'}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default function StrategicLevelsManager({ initialLevels, levelCounts }: Props) {
  const [levels, setLevels] = useState<StrategicLevel[]>(initialLevels)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#378ADD', description: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleAdd() {
    if (!form.name.trim()) return
    try {
      const newLevel = await createStrategicLevel(form.name, form.color, form.description)
      setLevels((prev) => [...prev, newLevel])
      setForm({ name: '', color: '#378ADD', description: '' })
      setAdding(false)
    } catch {
      setToast('Failed to create level')
    }
  }

  function startEdit(level: StrategicLevel) {
    setEditingId(level.id)
    setForm({ name: level.name, color: level.color, description: level.description })
  }

  async function handleSaveEdit() {
    if (!editingId || !form.name.trim()) return
    try {
      await updateStrategicLevel(editingId, { name: form.name, color: form.color, description: form.description })
      setLevels((prev) => prev.map((l) => l.id === editingId ? { ...l, name: form.name, color: form.color, description: form.description } : l))
      setEditingId(null)
      setForm({ name: '', color: '#378ADD', description: '' })
    } catch {
      setToast('Failed to update level')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this strategic level?')) return
    const result = await deleteStrategicLevel(id)
    if (result.error) {
      setToast(result.error)
      return
    }
    setLevels((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = levels.findIndex((l) => l.id === active.id)
    const newIndex = levels.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(levels, oldIndex, newIndex)
    setLevels(reordered)
    await updateStrategicLevelPositions(reordered.map((l, idx) => ({ id: l.id, position: idx })))
  }

  return (
    <div>
      <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">Strategic levels</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200">
              <th className="py-2 pr-2 text-left w-6" />
              <th className="py-2 pr-3 text-left w-8">Color</th>
              <th className="py-2 pr-3 text-left">Name</th>
              <th className="py-2 pr-3 text-left">Description</th>
              <th className="py-2 pr-3 text-center w-16">Count</th>
              <th className="py-2 text-right w-24" />
            </tr>
          </thead>
          <SortableContext items={levels.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {levels.map((level) => {
                if (editingId === level.id) {
                  return (
                    <tr key={level.id} className="border-b border-neutral-100">
                      <td className="py-2" />
                      <td className="py-2 pr-3">
                        <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-6 h-6 border-0 p-0 cursor-pointer" />
                      </td>
                      <td className="py-2 pr-3">
                        <input className="w-full text-[13px] border border-neutral-300 rounded px-2 py-1 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </td>
                      <td className="py-2 pr-3">
                        <input className="w-full text-[12px] border border-neutral-300 rounded px-2 py-1 outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                      </td>
                      <td className="py-2 text-center text-[12px] text-neutral-500">{levelCounts[level.id] ?? 0}</td>
                      <td className="py-2 text-right">
                        <button onClick={handleSaveEdit} className="text-[11px] font-medium text-neutral-800 mr-2">Save</button>
                        <button onClick={() => { setEditingId(null); setForm({ name: '', color: '#378ADD', description: '' }) }} className="text-[11px] text-neutral-400">Cancel</button>
                      </td>
                    </tr>
                  )
                }
                return (
                  <SortableRow
                    key={level.id}
                    level={level}
                    count={levelCounts[level.id] ?? 0}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                )
              })}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>

      {adding ? (
        <div className="mt-4 flex items-center gap-2 border border-neutral-200 rounded-lg p-3">
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-6 h-6 border-0 p-0 cursor-pointer" />
          <input className="flex-1 text-[13px] border border-neutral-300 rounded px-2 py-1 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Level name" autoFocus />
          <input className="flex-1 text-[12px] border border-neutral-300 rounded px-2 py-1 outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" />
          <button onClick={handleAdd} className="text-[11px] font-medium px-3 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700">Add</button>
          <button onClick={() => { setAdding(false); setForm({ name: '', color: '#378ADD', description: '' }) }} className="text-[11px] text-neutral-400">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 text-[12px] text-neutral-400 hover:text-neutral-600 border border-dashed border-neutral-300 rounded-lg px-4 py-2 hover:border-neutral-400 transition-colors"
        >
          + Add level
        </button>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
