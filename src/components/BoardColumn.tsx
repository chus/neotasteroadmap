'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import InitiativeCard from './InitiativeCard'
import type { Initiative, Column, ReactionCount } from '@/types'

const RELEASED_CAP = 5

interface Props {
  columnId: Column
  label: string
  sublabel: string
  months?: string
  initiatives: Initiative[]
  activeFilterLevelId: string | null
  searchQuery: string
  isOver?: boolean
  onEdit: (initiative: Initiative) => void
  onDelete: (id: string) => void
  onAddClick: (column: Column) => void
  onCardClick: (initiative: Initiative) => void
  reactionMap?: Record<string, ReactionCount[]>
}

export default function BoardColumn({
  columnId,
  label,
  sublabel,
  months,
  initiatives,
  activeFilterLevelId,
  searchQuery,
  isOver,
  onEdit,
  onDelete,
  onAddClick,
  onCardClick,
  reactionMap,
}: Props) {
  const { setNodeRef } = useDroppable({ id: columnId })
  const [showAll, setShowAll] = useState(false)

  const filteredInitiatives = initiatives.filter((i) => {
    const matchesFilter = !activeFilterLevelId || i.strategic_level_id === activeFilterLevelId
    const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Released column: sort by released_at desc, cap at 5 unless expanded
  const isReleased = columnId === 'released'
  const sorted = isReleased
    ? [...filteredInitiatives].sort((a, b) => {
        const da = a.released_at ? new Date(a.released_at).getTime() : 0
        const db = b.released_at ? new Date(b.released_at).getTime() : 0
        return db - da
      })
    : filteredInitiatives
  const canCollapse = isReleased && sorted.length > RELEASED_CAP
  const visibleInitiatives = canCollapse && !showAll ? sorted.slice(0, RELEASED_CAP) : sorted

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
        {months && (
          <div className="text-[10px] text-neutral-400 mt-0.5">{months}</div>
        )}
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
                reactions={reactionMap?.[initiative.id]}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[60px]">
              <span className="text-[11px] text-neutral-300">No initiatives</span>
            </div>
          )}
        </SortableContext>
      </div>
      {canCollapse && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-1 w-full text-[11px] text-neutral-400 hover:text-neutral-600 py-1"
        >
          {showAll ? 'Show less' : `Show ${sorted.length - RELEASED_CAP} more`}
        </button>
      )}
      <button
        onClick={() => onAddClick(columnId)}
        className="mt-2 w-full text-[11px] text-neutral-400 hover:text-neutral-600 border border-dashed border-neutral-300 rounded-lg py-1.5 hover:border-neutral-400 transition-colors"
      >
        + Add initiative
      </button>
    </div>
  )
}
