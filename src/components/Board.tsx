'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import BoardColumn from './BoardColumn'
import Legend from './Legend'
import { updateInitiativeColumn, updatePositions } from '@/app/actions'
import { COLUMNS, TRACK_LABELS } from '@/lib/constants'
import type { Initiative, Track, Column } from '@/types'

interface Props {
  initialData: Initiative[]
}

export default function Board({ initialData }: Props) {
  const [items, setItems] = useState<Initiative[]>(initialData)
  const [activeFilter, setActiveFilter] = useState<Track | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getColumnItems = useCallback(
    (col: Column) =>
      items
        .filter((i) => i.column === col)
        .sort((a, b) => a.position - b.position),
    [items]
  )

  function findColumn(id: string): Column | undefined {
    const item = items.find((i) => i.id === id)
    if (item) return item.column
    return COLUMNS.find((c) => c.id === id)?.id
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeCol = findColumn(active.id as string)
    let overCol = findColumn(over.id as string)

    // If hovering over a column droppable directly
    if (!overCol) {
      const col = COLUMNS.find((c) => c.id === over.id)
      if (col) overCol = col.id
    }

    if (!activeCol || !overCol || activeCol === overCol) return

    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === active.id ? { ...item, column: overCol! } : item
      )
      return updated
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeItem = items.find((i) => i.id === active.id)
    if (!activeItem) return

    const overCol = findColumn(over.id as string) || (COLUMNS.find((c) => c.id === over.id)?.id)
    if (!overCol) return

    const columnChanged = activeItem.column !== overCol

    setItems((prev) => {
      let updated = [...prev]

      if (columnChanged) {
        updated = updated.map((item) =>
          item.id === active.id ? { ...item, column: overCol } : item
        )
      }

      const colItems = updated
        .filter((i) => i.column === overCol)
        .sort((a, b) => a.position - b.position)

      const oldIndex = colItems.findIndex((i) => i.id === active.id)
      const overItem = colItems.findIndex((i) => i.id === over.id)
      const newIndex = overItem >= 0 ? overItem : colItems.length - 1

      if (oldIndex !== newIndex && oldIndex >= 0) {
        const reordered = arrayMove(colItems, oldIndex, newIndex)
        const positionUpdates = reordered.map((item, idx) => ({
          ...item,
          position: idx,
        }))

        updated = updated.map((item) => {
          const posUpdate = positionUpdates.find((p) => p.id === item.id)
          return posUpdate ? { ...item, position: posUpdate.position } : item
        })
      } else if (columnChanged) {
        // Just update positions in the target column
        const targetItems = updated
          .filter((i) => i.column === overCol)
          .sort((a, b) => a.position - b.position)
        const positionUpdates = targetItems.map((item, idx) => ({
          ...item,
          position: idx,
        }))
        updated = updated.map((item) => {
          const posUpdate = positionUpdates.find((p) => p.id === item.id)
          return posUpdate ? { ...item, position: posUpdate.position } : item
        })
      }

      return updated
    })

    // Sync to DB
    if (columnChanged) {
      const targetItems = items
        .filter((i) => i.column === overCol || i.id === active.id)
        .map((i) => (i.id === active.id ? { ...i, column: overCol } : i))
        .filter((i) => i.column === overCol)

      await updateInitiativeColumn(active.id as string, overCol, targetItems.length - 1)
    }

    // Update positions for affected column
    setTimeout(async () => {
      const currentItems = items
        .filter((i) => i.column === overCol || i.id === active.id)
        .map((i) => (i.id === active.id ? { ...i, column: overCol } : i))
        .filter((i) => i.column === overCol)
        .sort((a, b) => a.position - b.position)

      await updatePositions(
        currentItems.map((item, idx) => ({ id: item.id, position: idx }))
      )
    }, 0)
  }

  function handleUpdate(updated: Initiative) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleCreate(initiative: Initiative) {
    setItems((prev) => [...prev, initiative])
  }

  const filters: { key: Track | null; label: string }[] = [
    { key: null, label: 'All' },
    ...Object.entries(TRACK_LABELS).map(([k, v]) => ({
      key: k as Track,
      label: v,
    })),
  ]

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key ?? 'all'}
            onClick={() => setActiveFilter(f.key)}
            className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
              activeFilter === f.key
                ? 'border-neutral-500 bg-neutral-100 text-neutral-800'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              sublabel={col.sublabel}
              initiatives={getColumnItems(col.id)}
              activeFilter={activeFilter}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onCreate={handleCreate}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border border-neutral-300 bg-white p-3 shadow-sm opacity-80">
              <span className="text-[13px] font-medium">
                {items.find((i) => i.id === activeId)?.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Legend />
    </div>
  )
}
