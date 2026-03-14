'use client'

import { COLUMNS, CRITERION_CONFIG } from '@/lib/constants'
import type { Initiative, StrategicLevel, Criterion } from '@/types'

const COLUMN_COLORS: Record<string, string> = {
  now: '#50E88A',
  next: '#378ADD',
  later: '#7F77DD',
  parked: '#999',
}

interface Props {
  items: Initiative[]
  levels: StrategicLevel[]
}

export default function StatsPanel({ items, levels }: Props) {
  const total = items.length
  if (total === 0) return null

  // By column
  const columnCounts = COLUMNS.map((c) => ({
    ...c,
    count: items.filter((i) => i.column === c.id).length,
    color: COLUMN_COLORS[c.id] ?? '#999',
  }))

  // By level
  const levelCounts = levels.map((l) => ({
    ...l,
    count: items.filter((i) => i.strategic_level_id === l.id).length,
  }))
  const bottleneckThreshold = total * 0.4
  const levelBottleneck = levelCounts.some((l) => l.count > bottleneckThreshold)

  // By criterion
  const criterionKeys = Object.keys(CRITERION_CONFIG) as Criterion[]
  const criterionCounts = criterionKeys.map((key) => ({
    key,
    ...CRITERION_CONFIG[key],
    count: items.filter((i) => i.criterion === key).length,
  }))
  const criterionBottleneckThreshold = total * 0.5
  const criterionBottleneck = criterionCounts.some((c) => c.count > criterionBottleneckThreshold)

  // Generate insight
  function generateInsight(): string {
    // Highest criterion concentration
    const maxCriterion = criterionCounts.reduce((a, b) => (a.count > b.count ? a : b))
    if (maxCriterion.key === 'research' && maxCriterion.count >= 3) {
      return `${maxCriterion.count} of ${total} initiatives are research-blocked — consider whether any spikes can be parallelised.`
    }

    // Level imbalance
    const maxLevel = levelCounts.reduce((a, b) => (a.count > b.count ? a : b), levelCounts[0])
    const minLevel = levelCounts.filter((l) => l.count > 0).reduce((a, b) => (a.count < b.count ? a : b), levelCounts[0])
    if (maxLevel && minLevel && maxLevel.count > minLevel.count * 4 && maxLevel.count >= 5) {
      return `${maxLevel.name} has ${maxLevel.count} initiatives on the board. ${minLevel.name} has ${minLevel.count}. Check strategic balance.`
    }

    // Parked check
    const parkedCount = items.filter((i) => i.column === 'parked').length
    if (parkedCount === 0) {
      return 'Nothing is parked. Either the scope is well-managed or deprioritisation decisions haven\'t been made yet.'
    }

    // Default
    const nowCount = items.filter((i) => i.column === 'now').length
    return `${nowCount} initiatives are in active work (Now column) out of ${total} total.`
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Row 1: By column */}
      <div className="grid grid-cols-4 gap-2">
        {columnCounts.map((c) => (
          <div key={c.id} className="border border-neutral-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] uppercase tracking-wide font-medium text-neutral-500">{c.label}</span>
            </div>
            <span className="text-[20px] font-semibold text-neutral-800">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Row 2: By strategic level */}
      <div className="grid grid-cols-4 gap-2">
        {levelCounts.map((l) => (
          <div key={l.id} className="border border-neutral-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] uppercase tracking-wide font-medium text-neutral-500">{l.name}</span>
              {l.count > bottleneckThreshold && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto" title="Potential bottleneck" />
              )}
            </div>
            <span className="text-[20px] font-semibold text-neutral-800">{l.count}</span>
          </div>
        ))}
      </div>

      {/* Row 3: By criterion */}
      <div className="grid grid-cols-5 gap-2">
        {criterionCounts.map((c) => (
          <div key={c.key} className="border border-neutral-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.border }} />
              <span className="text-[9px] uppercase tracking-wide font-medium text-neutral-500 truncate">{c.label}</span>
              {c.count > criterionBottleneckThreshold && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" title="Bottleneck" />
              )}
            </div>
            <span className="text-[20px] font-semibold text-neutral-800">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Insight */}
      <p className="text-[12px] text-neutral-400 italic">{generateInsight()}</p>
    </div>
  )
}
