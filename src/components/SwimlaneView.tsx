'use client'

import { COLUMNS, CRITERION_CONFIG, EFFORT_CONFIG, MONTH_SHORT } from '@/lib/constants'
import type { Initiative, StrategicLevel, Criterion } from '@/types'

interface Props {
  initiatives: Initiative[]
  levels: StrategicLevel[]
  activeFilterLevelId: string | null
  searchQuery: string
  onCardClick: (initiative: Initiative) => void
}

function CompactCard({ initiative, onClick }: { initiative: Initiative; onClick: () => void }) {
  const config = CRITERION_CONFIG[initiative.criterion]

  return (
    <div
      onClick={onClick}
      className="relative rounded-md border border-neutral-200 bg-white p-2 cursor-pointer hover:border-neutral-300 transition-colors overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: config.border }} />
      <p className="text-[12px] font-medium text-neutral-800 leading-tight pl-1.5">{initiative.title}</p>
      <div className="flex items-center gap-1.5 mt-1 pl-1.5">
        <span
          className="text-[9px] font-medium px-1 py-0.5 rounded"
          style={{ backgroundColor: config.badge, color: config.color }}
        >
          {config.label}
        </span>
        {initiative.effort && EFFORT_CONFIG[initiative.effort] && (
          <span
            className="text-[9px] font-semibold px-1 py-0.5 rounded"
            style={{
              backgroundColor: EFFORT_CONFIG[initiative.effort].color + '1a',
              color: EFFORT_CONFIG[initiative.effort].color,
            }}
          >
            {EFFORT_CONFIG[initiative.effort].label}
          </span>
        )}
        {initiative.target_month && MONTH_SHORT[initiative.target_month] && (
          <span className="text-[9px] font-medium text-neutral-400 bg-neutral-100 rounded px-1 py-0.5">
            {MONTH_SHORT[initiative.target_month]}
          </span>
        )}
      </div>
    </div>
  )
}

const BOTTLENECK_THRESHOLD = 5

export default function SwimlaneView({ initiatives, levels, activeFilterLevelId, searchQuery, onCardClick }: Props) {
  const filtered = initiatives.filter((i) => {
    const matchesFilter = !activeFilterLevelId || i.strategic_level_id === activeFilterLevelId
    const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Group by level + column
  function getItems(levelId: string | null, colId: string) {
    return filtered
      .filter((i) => i.strategic_level_id === levelId && i.column === colId)
      .sort((a, b) => a.position - b.position)
  }

  // Include unassigned row if there are items without a level
  const unassigned = filtered.filter((i) => !i.strategic_level_id)
  const displayLevels: { id: string | null; name: string; color: string }[] = [
    ...levels.map((l) => ({ id: l.id as string | null, name: l.name, color: l.color })),
    ...(unassigned.length > 0 ? [{ id: null, name: 'Unassigned', color: '#999' }] : []),
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white w-[160px] min-w-[160px] p-2 text-left" />
            {COLUMNS.map((col) => (
              <th key={col.id} className="p-2 text-[11px] font-semibold text-neutral-600 uppercase tracking-wide text-left">
                {col.label}
                <span className="text-[9px] font-normal text-neutral-400 ml-1">{col.sublabel}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayLevels.map((level) => {
            const totalForLevel = COLUMNS.reduce(
              (sum, col) => sum + getItems(level.id, col.id).length,
              0
            )
            if (totalForLevel === 0 && activeFilterLevelId) return null

            return (
              <tr key={level.id ?? 'unassigned'} className="border-t border-neutral-100">
                <td className="sticky left-0 z-10 bg-white p-2 align-top">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="text-[12px] font-medium text-neutral-700">{level.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 ml-4">{totalForLevel} items</span>
                </td>
                {COLUMNS.map((col) => {
                  const items = getItems(level.id, col.id)
                  const isBottleneck = items.length >= BOTTLENECK_THRESHOLD

                  return (
                    <td
                      key={col.id}
                      className="p-2 align-top"
                      style={{
                        minWidth: 180,
                        backgroundColor: isBottleneck ? '#fefce8' : undefined,
                      }}
                    >
                      {isBottleneck && (
                        <div className="text-[9px] font-medium text-amber-600 uppercase tracking-wide mb-1">
                          {items.length} items
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <CompactCard
                            key={item.id}
                            initiative={item}
                            onClick={() => onCardClick(item)}
                          />
                        ))}
                      </div>
                      {items.length === 0 && (
                        <div className="text-[10px] text-neutral-300 italic py-2">—</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
