'use client'

import { useState, useCallback, useRef } from 'react'
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
import InitiativeModal from './InitiativeModal'
import InitiativeSlideOver from './InitiativeSlideOver'
import SwimlaneView from './SwimlaneView'
import ListView from './ListView'
import StatsPanel from './StatsPanel'
import Toast from './Toast'
import {
  updateInitiativeColumn,
  updatePositions,
  updateInitiative,
  createInitiative,
  deleteInitiative,
  getStrategicLevels as fetchLevels,
} from '@/app/actions'
import { COLUMNS } from '@/lib/constants'
import type { Initiative, StrategicLevel, Column, Criterion } from '@/types'

type ViewMode = 'board' | 'swimlane' | 'list'

interface Props {
  initialData: Initiative[]
  initialLevels: StrategicLevel[]
}

export default function Board({ initialData, initialLevels }: Props) {
  const [items, setItems] = useState<Initiative[]>(initialData)
  const [levels, setLevels] = useState<StrategicLevel[]>(initialLevels)
  const [activeFilterLevelId, setActiveFilterLevelId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('roadmap_view_mode') as ViewMode) || 'board'
    }
    return 'board'
  })

  // Modal state
  const [addingToColumn, setAddingToColumn] = useState<Column | null>(null)

  // Slide-over state
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)

  function switchView(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem('roadmap_view_mode', mode)
  }

  const prevItemsRef = useRef<Initiative[]>(items)

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

  const filteredCount = items.filter((i) => {
    const matchesFilter = !activeFilterLevelId || i.strategic_level_id === activeFilterLevelId
    const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  }).length

  const hasActiveFilters = activeFilterLevelId !== null || searchQuery.length > 0

  function findColumn(id: string): Column | undefined {
    const item = items.find((i) => i.id === id)
    if (item) return item.column
    return COLUMNS.find((c) => c.id === id)?.id
  }

  function handleDragStart(event: DragStartEvent) {
    prevItemsRef.current = [...items]
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverId(null); return }

    const overCol = findColumn(over.id as string) || COLUMNS.find((c) => c.id === over.id)?.id
    setOverId(overCol ?? null)

    const activeCol = findColumn(active.id as string)
    if (!activeCol || !overCol || activeCol === overCol) return

    setItems((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, column: overCol! } : item
      )
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeItem = items.find((i) => i.id === active.id)
    if (!activeItem) return

    const overCol = findColumn(over.id as string) || COLUMNS.find((c) => c.id === over.id)?.id
    if (!overCol) return

    const columnChanged = prevItemsRef.current.find((i) => i.id === active.id)?.column !== overCol

    setItems((prev) => {
      let updated = [...prev]
      if (columnChanged) {
        updated = updated.map((item) =>
          item.id === active.id ? { ...item, column: overCol } : item
        )
      }
      const colItems = updated.filter((i) => i.column === overCol).sort((a, b) => a.position - b.position)
      const oldIndex = colItems.findIndex((i) => i.id === active.id)
      const overItem = colItems.findIndex((i) => i.id === over.id)
      const newIndex = overItem >= 0 ? overItem : colItems.length - 1

      if (oldIndex !== newIndex && oldIndex >= 0) {
        const reordered = arrayMove(colItems, oldIndex, newIndex)
        const positionUpdates = reordered.map((item, idx) => ({ ...item, position: idx }))
        updated = updated.map((item) => {
          const posUpdate = positionUpdates.find((p) => p.id === item.id)
          return posUpdate ? { ...item, position: posUpdate.position } : item
        })
      } else if (columnChanged) {
        const targetItems = updated.filter((i) => i.column === overCol).sort((a, b) => a.position - b.position)
        const positionUpdates = targetItems.map((item, idx) => ({ ...item, position: idx }))
        updated = updated.map((item) => {
          const posUpdate = positionUpdates.find((p) => p.id === item.id)
          return posUpdate ? { ...item, position: posUpdate.position } : item
        })
      }
      return updated
    })

    try {
      if (columnChanged) {
        const targetItems = items
          .filter((i) => i.column === overCol || i.id === active.id)
          .map((i) => (i.id === active.id ? { ...i, column: overCol } : i))
          .filter((i) => i.column === overCol)
        await updateInitiativeColumn(active.id as string, overCol, targetItems.length - 1)
      }
      const currentItems = items
        .filter((i) => i.column === overCol || i.id === active.id)
        .map((i) => (i.id === active.id ? { ...i, column: overCol } : i))
        .filter((i) => i.column === overCol)
        .sort((a, b) => a.position - b.position)
      await updatePositions(currentItems.map((item, idx) => ({ id: item.id, position: idx })))
    } catch {
      setItems(prevItemsRef.current)
      setToast('Failed to save — changes reverted')
    }
  }

  function handleCardClick(initiative: Initiative) {
    setSelectedInitiative(initiative)
  }

  function handleEditFromMenu(initiative: Initiative) {
    setSelectedInitiative(initiative)
  }

  async function handleSlideOverSave(data: {
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
  }) {
    if (!selectedInitiative) return
    try {
      await updateInitiative(selectedInitiative.id, data)
      const level = levels.find((l) => l.id === data.strategic_level_id)
      setItems((prev) =>
        prev.map((i) => i.id === selectedInitiative.id ? {
          ...i,
          ...data,
          column: data.column ?? i.column,
          strategic_level_name: level?.name ?? '',
          strategic_level_color: level?.color ?? '#999',
        } : i)
      )
      setSelectedInitiative(null)
    } catch {
      setToast('Failed to save — changes reverted')
    }
  }

  async function handleSlideOverDelete() {
    if (!selectedInitiative) return
    if (!confirm('Delete this initiative?')) return
    try {
      await deleteInitiative(selectedInitiative.id)
      setItems((prev) => prev.filter((i) => i.id !== selectedInitiative.id))
      setSelectedInitiative(null)
    } catch {
      setToast('Failed to delete')
    }
  }

  async function handleAddSave(data: {
    title: string
    subtitle: string
    strategic_level_id: string | null
    criterion: Criterion
    criterion_secondary: Criterion | null
    dep_note: string
    effort?: string | null
    target_month?: string | null
    column?: Column
  }) {
    const col = data.column ?? addingToColumn ?? 'now'
    const colItems = items.filter((i) => i.column === col)
    try {
      const newInit = await createInitiative({
        title: data.title,
        subtitle: data.subtitle,
        strategic_level_id: data.strategic_level_id,
        criterion: data.criterion,
        criterion_secondary: data.criterion_secondary,
        column: col,
        position: colItems.length,
        dep_note: data.dep_note,
        effort: data.effort,
        target_month: data.target_month,
      })
      setItems((prev) => [...prev, newInit])
    } catch {
      setToast('Failed to create initiative')
    }
    setAddingToColumn(null)
  }

  function handleDeleteFromCard(id: string) {
    deleteInitiative(id)
      .then(() => setItems((prev) => prev.filter((i) => i.id !== id)))
      .catch(() => setToast('Failed to delete'))
  }

  // Refresh levels after settings changes
  async function refreshLevels() {
    const fresh = await fetchLevels()
    setLevels(fresh)
  }

  const filters: { key: string | null; label: string; color?: string }[] = [
    { key: null, label: 'All' },
    ...levels.map((l) => ({ key: l.id, label: l.name, color: l.color })),
  ]

  const activeColumns = COLUMNS.filter((c) => c.id !== 'parked')
  const parkedColumn = COLUMNS.find((c) => c.id === 'parked')!

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search initiatives…"
            className="w-full max-w-xs text-[13px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400"
          />
          <div className="flex items-center gap-3 ml-4">
            {/* View mode toggle */}
            <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => switchView('board')}
                title="Board view"
                className={`px-2 py-1.5 ${viewMode === 'board' ? 'bg-neutral-100 text-neutral-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => switchView('swimlane')}
                title="Swimlane view"
                className={`px-2 py-1.5 border-l border-r border-neutral-200 ${viewMode === 'swimlane' ? 'bg-neutral-100 text-neutral-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => switchView('list')}
                title="List view"
                className={`px-2 py-1.5 ${viewMode === 'list' ? 'bg-neutral-100 text-neutral-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showStats ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showStats ? 'Hide stats' : 'Show stats'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key ?? 'all'}
              onClick={() => setActiveFilterLevelId(f.key)}
              className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
                activeFilterLevelId === f.key
                  ? 'border-neutral-500 bg-neutral-100 text-neutral-800'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              {f.color && (
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 -mt-0.5 align-middle" style={{ backgroundColor: f.color }} />
              )}
              {f.label}
            </button>
          ))}
          {hasActiveFilters && (
            <>
              <span className="text-[11px] text-neutral-400 ml-2">
                Showing {filteredCount} of {items.length}
              </span>
              <button
                onClick={() => { setActiveFilterLevelId(null); setSearchQuery('') }}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 underline ml-1"
              >
                Reset filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats panel */}
      {showStats && <StatsPanel items={items} levels={levels} />}

      {viewMode === 'board' && (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-4">
              {activeColumns.map((col) => (
                <BoardColumn
                  key={col.id}
                  columnId={col.id}
                  label={col.label}
                  sublabel={col.sublabel}
                  initiatives={getColumnItems(col.id)}
                  activeFilterLevelId={activeFilterLevelId}
                  searchQuery={searchQuery}
                  isOver={overId === col.id}
                  onEdit={handleEditFromMenu}
                  onDelete={handleDeleteFromCard}
                  onAddClick={setAddingToColumn}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            {/* Parked divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[10px] uppercase tracking-widest text-neutral-400">
                  Out of scope
                </span>
              </div>
            </div>

            <div className="max-w-sm">
              <BoardColumn
                columnId={parkedColumn.id}
                label={parkedColumn.label}
                sublabel={parkedColumn.sublabel}
                initiatives={getColumnItems(parkedColumn.id)}
                activeFilterLevelId={activeFilterLevelId}
                searchQuery={searchQuery}
                isOver={overId === 'parked'}
                onEdit={handleEditFromMenu}
                onDelete={handleDeleteFromCard}
                onAddClick={setAddingToColumn}
                onCardClick={handleCardClick}
              />
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
        </>
      )}

      {viewMode === 'swimlane' && (
        <SwimlaneView
          initiatives={items}
          levels={levels}
          activeFilterLevelId={activeFilterLevelId}
          searchQuery={searchQuery}
          onCardClick={handleCardClick}
        />
      )}

      {viewMode === 'list' && (
        <ListView
          initiatives={items}
          levels={levels}
          activeFilterLevelId={activeFilterLevelId}
          searchQuery={searchQuery}
          onCardClick={handleCardClick}
          onDelete={handleDeleteFromCard}
        />
      )}

      {/* Slide-over for card detail/edit */}
      {selectedInitiative && (
        <InitiativeSlideOver
          initiative={selectedInitiative}
          strategicLevels={levels}
          onSave={handleSlideOverSave}
          onDelete={handleSlideOverDelete}
          onClose={() => setSelectedInitiative(null)}
        />
      )}

      {/* Add modal */}
      {addingToColumn && (
        <InitiativeModal
          defaultColumn={addingToColumn}
          strategicLevels={levels}
          onSave={handleAddSave}
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
