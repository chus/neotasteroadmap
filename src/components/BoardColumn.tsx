'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import InitiativeCard from './InitiativeCard'
import type { Initiative, Column } from '@/types'

interface Props {
  columnId: Column
  label: string
  sublabel: string
  initiatives: Initiative[]
  activeFilterLevelId: string | null
  searchQuery: string
  isOver?: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (id: string) => void
  onAddClick: (column: Column) => void
  onCardClick: (initiative: Initiative) => void
}

export default function BoardColumn({
  columnId,
  label,
  sublabel,
  initiatives,
  activeFilterLevelId,
  searchQuery,
  isOver,
  onEdit,
  onDelete,
  onAddClick,
  onCardClick,
}: Props) {
  const { setNodeRef } = useDroppable({ id: columnId })

  const visibleInitiatives = initiatives.filter((i) => {
    const matchesFilter = !activeFilterLevelId || i.strategic_level_id === activeFilterLevelId
    const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[11px] uppercase tracking-wider font-medium text-neutral-500">
            {label}
          </h2>
          <span className="text-[11px] text-neutral-400">·</span>
          <span className="text-[11px] text-neutral-400">{sublabel}</span>
          <span className="text-[11px] font-medium text-neutral-400 ml-auto">{initiatives.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 min-h-[60px] rounded-lg p-1 -m-1 transition-colors"
        style={isOver ? {
          backgroundColor: 'rgba(80, 232, 138, 0.08)',
          border: '1px solid rgba(80, 232, 138, 0.4)',
        } : {
          border: '1px solid transparent',
        }}
      >
        <SortableContext items={visibleInitiatives.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {visibleInitiatives.length > 0 ? (
            visibleInitiatives.map((initiative) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                dimmed={false}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onCardClick}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[60px]">
              <span className="text-[11px] text-neutral-300">No initiatives</span>
            </div>
          )}
        </SortableContext>
      </div>
      <button
        onClick={() => onAddClick(columnId)}
        className="mt-2 w-full text-[11px] text-neutral-400 hover:text-neutral-600 border border-dashed border-neutral-300 rounded-lg py-1.5 hover:border-neutral-400 transition-colors"
      >
        + Add initiative
      </button>
    </div>
  )
}
