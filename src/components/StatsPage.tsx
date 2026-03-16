'use client'

import { useState, useEffect } from 'react'
import { COLUMNS, CRITERION_CONFIG, EFFORT_CONFIG, MONTHS_2026, MONTH_SHORT, EFFORT_WEEKS, isMonthInColumnRange } from '@/lib/constants'
import type { Initiative, StrategicLevel, FeatureRequest, Criterion } from '@/types'

const COLUMN_COLORS: Record<string, string> = {
  now: '#50E88A',
  next: '#378ADD',
  later: '#7F77DD',
  parked: '#999',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#3b82f6' },
  under_review: { label: 'Under review', color: '#f59e0b' },
  planned: { label: 'Planned', color: '#8b5cf6' },
  promoted: { label: 'Promoted', color: '#10b981' },
  declined: { label: 'Declined', color: '#ef4444' },
}

interface Props {
  initiatives: Initiative[]
  levels: StrategicLevel[]
  requests: FeatureRequest[]
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-neutral-500 w-[130px] truncate shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-neutral-100 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[13px] font-semibold text-neutral-700 w-8 text-right">{count}</span>
      <span className="text-[11px] text-neutral-400 w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  )
}

function SummaryCard({ label, value, sublabel, color }: { label: string; value: number; sublabel?: string; color?: string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wide font-medium text-neutral-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        <span className="text-[28px] font-semibold text-neutral-800">{value}</span>
      </div>
      {sublabel && <div className="text-[11px] text-neutral-400 mt-0.5">{sublabel}</div>}
    </div>
  )
}

function generateInsights(items: Initiative[], levels: StrategicLevel[], requests: FeatureRequest[]): string[] {
  const insights: string[] = []
  const total = items.length

  // Column balance
  const nowCount = items.filter((i) => i.column === 'now').length
  const parkedCount = items.filter((i) => i.column === 'parked').length
  if (nowCount > 0) {
    insights.push(`${nowCount} initiative${nowCount === 1 ? '' : 's'} in active work (Now column) out of ${total} total.`)
  }
  if (parkedCount === 0 && total > 0) {
    insights.push('Nothing is parked — either scope is well-managed or deprioritisation decisions haven\'t been made yet.')
  }

  // Research bottleneck
  const researchCount = items.filter((i) => i.criterion === 'research').length
  if (researchCount >= 3) {
    insights.push(`${researchCount} initiatives are research-blocked — consider whether any spikes can be parallelised.`)
  }

  // Dependency bottleneck
  const depCount = items.filter((i) => i.criterion === 'dependency').length
  if (depCount >= 3) {
    insights.push(`${depCount} initiatives have team dependencies — cross-team coordination may be the critical path.`)
  }

  // Level imbalance
  const levelCounts = levels.map((l) => ({ name: l.name, count: items.filter((i) => i.strategic_level_id === l.id).length }))
  const maxLevel = levelCounts.reduce((a, b) => (a.count > b.count ? a : b), levelCounts[0])
  const minLevel = levelCounts.filter((l) => l.count > 0).reduce((a, b) => (a.count < b.count ? a : b), levelCounts[0])
  if (maxLevel && minLevel && maxLevel.count > minLevel.count * 3 && maxLevel.count >= 5) {
    insights.push(`"${maxLevel.name}" has ${maxLevel.count} initiatives while "${minLevel.name}" has ${minLevel.count}. Consider strategic balance.`)
  }

  // Feature requests insight
  const openRequests = requests.filter((r) => r.status === 'open').length
  const highVoteRequests = requests.filter((r) => r.vote_count >= 30).length
  if (highVoteRequests > 0) {
    insights.push(`${highVoteRequests} feature request${highVoteRequests === 1 ? '' : 's'} with 30+ votes — consider prioritising for roadmap.`)
  }
  if (openRequests > 0) {
    insights.push(`${openRequests} open feature request${openRequests === 1 ? '' : 's'} awaiting review.`)
  }

  // Month/column mismatch
  const mismatchCount = items.filter(
    (i) => i.target_month && i.column !== 'parked' && i.column !== 'released' && !isMonthInColumnRange(i.target_month, i.column)
  ).length
  if (mismatchCount > 0) {
    insights.push(`${mismatchCount} initiative${mismatchCount === 1 ? ' has a' : 's have'} target month outside ${mismatchCount === 1 ? 'its' : 'their'} column's typical range — review the mismatches below.`)
  }

  // Effort insights
  const withEffort = items.filter((i) => i.effort)
  if (withEffort.length === 0 && total > 0) {
    insights.push('No effort estimates have been added yet. Adding them unlocks capacity insights.')
  } else if (withEffort.length > 0) {
    const largeInNow = items.filter((i) => i.column === 'now' && (i.effort === 'l' || i.effort === 'xl')).length
    if (largeInNow > 3) {
      insights.push(`Heavy lifting is concentrated in Now — ${largeInNow} large initiatives are in flight simultaneously.`)
    }
    const smallCount = withEffort.filter((i) => i.effort === 'xs' || i.effort === 's').length
    if (withEffort.length > 0 && smallCount / withEffort.length > 0.6) {
      insights.push('The board skews toward smaller items. Check whether large strategic bets are being avoided.')
    }
  }

  return insights.length > 0 ? insights : ['Roadmap looks balanced. No bottlenecks detected.']
}

function CapacitySection({ initiatives }: { initiatives: Initiative[] }) {
  const [engineers, setEngineers] = useState(4)
  const [weeksPerQ, setWeeksPerQ] = useState(10)

  useEffect(() => {
    const stored = localStorage.getItem('capacity_engineers')
    const storedWeeks = localStorage.getItem('capacity_weeks')
    if (stored) setEngineers(parseInt(stored))
    if (storedWeeks) setWeeksPerQ(parseInt(storedWeeks))
  }, [])

  function updateEngineers(v: number) {
    setEngineers(v)
    localStorage.setItem('capacity_engineers', String(v))
  }
  function updateWeeks(v: number) {
    setWeeksPerQ(v)
    localStorage.setItem('capacity_weeks', String(v))
  }

  const totalCapacity = engineers * weeksPerQ
  const activeCols = COLUMNS.filter((c) => c.id !== 'parked')

  const colData = activeCols.map((col) => {
    const colItems = initiatives.filter((i) => i.column === col.id)
    const withEffort = colItems.filter((i) => i.effort && EFFORT_WEEKS[i.effort])
    const totalWeeks = withEffort.reduce((sum, i) => sum + (EFFORT_WEEKS[i.effort!] ?? 0), 0)
    const pct = totalCapacity > 0 ? (totalWeeks / totalCapacity) * 100 : 0
    return { ...col, totalWeeks, withEffort: withEffort.length, total: colItems.length, pct }
  })

  const activeNowNext = initiatives.filter((i) => i.column === 'now' || i.column === 'next')
  const noEstimate = activeNowNext.filter((i) => !i.effort).length
  const noEstimatePct = activeNowNext.length > 0 ? noEstimate / activeNowNext.length : 0

  const effortKeys = Object.keys(EFFORT_CONFIG)

  return (
    <section className="mb-8">
      <h2 className="text-[14px] font-semibold text-neutral-800 mb-1">Capacity planning</h2>
      <p className="text-[12px] text-neutral-400 mb-4">
        Estimated effort in weeks across columns. Based on effort estimates — initiatives without estimates are excluded.
      </p>

      {/* Team capacity input */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-neutral-500">Engineers</label>
          <input
            type="number"
            min={1}
            max={20}
            value={engineers}
            onChange={(e) => updateEngineers(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            className="w-14 text-[13px] border border-neutral-200 rounded px-2 py-1 text-center outline-none focus:border-neutral-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-neutral-500">Weeks / quarter</label>
          <input
            type="number"
            min={1}
            max={16}
            value={weeksPerQ}
            onChange={(e) => updateWeeks(Math.max(1, Math.min(16, parseInt(e.target.value) || 1)))}
            className="w-14 text-[13px] border border-neutral-200 rounded px-2 py-1 text-center outline-none focus:border-neutral-400"
          />
        </div>
        <div className="text-[12px] text-neutral-500">
          Total capacity: <strong className="text-neutral-700">{totalCapacity} engineer-weeks</strong>
        </div>
      </div>

      {/* Effort by column */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {colData.map((col) => {
          const barColor = col.pct > 100 ? '#ef4444' : col.pct > 80 ? '#f59e0b' : '#10b981'
          return (
            <div key={col.id}>
              <div className="text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">{col.label}</div>
              <div className="text-[20px] font-semibold text-neutral-800">{col.totalWeeks}<span className="text-[12px] font-normal text-neutral-400"> weeks</span></div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(col.pct, 100)}%`, backgroundColor: barColor }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                {col.withEffort} of {col.total} initiatives have effort estimates
              </p>
              {col.pct > 100 && (
                <p className="text-[10px] text-red-500 mt-1">
                  Exceeds capacity by {(col.totalWeeks - totalCapacity).toFixed(1)} weeks. Consider moving items to Next or reducing scope.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Effort breakdown table */}
      <div className="mb-4">
        <table className="w-full text-[12px]" style={{ maxWidth: 400 }}>
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200">
              <th className="py-2 text-left font-medium">Effort</th>
              {activeCols.map((c) => (
                <th key={c.id} className="py-2 text-center font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {effortKeys.map((ek) => (
              <tr key={ek} className="border-b border-neutral-100">
                <td className="py-2 font-medium text-neutral-600">{EFFORT_CONFIG[ek].label}</td>
                {activeCols.map((c) => {
                  const count = initiatives.filter((i) => i.effort === ek && i.column === c.id).length
                  const nowCapPct = colData.find((d) => d.id === 'now')?.pct ?? 0
                  const isRisk = (ek === 'l' || ek === 'xl') && c.id === 'now' && nowCapPct > 80 && count > 0
                  return (
                    <td
                      key={c.id}
                      className="py-2 text-center text-neutral-600"
                      style={isRisk ? { backgroundColor: '#fef3c7' } : undefined}
                    >
                      {count}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Missing estimates callout */}
      {noEstimatePct > 0.3 && (
        <div className="text-[12px] text-neutral-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {noEstimate} initiative{noEstimate !== 1 ? 's' : ''} in Now/Next {noEstimate !== 1 ? 'have' : 'has'} no effort estimate — capacity totals may be understated.
        </div>
      )}
    </section>
  )
}

export default function StatsPage({ initiatives, levels, requests }: Props) {
  const total = initiatives.length

  // By column
  const columnCounts = COLUMNS.map((c) => ({
    ...c,
    count: initiatives.filter((i) => i.column === c.id).length,
    color: COLUMN_COLORS[c.id] ?? '#999',
  }))

  // By level
  const levelCounts = levels.map((l) => ({
    ...l,
    count: initiatives.filter((i) => i.strategic_level_id === l.id).length,
  }))

  // By criterion
  const criterionKeys = Object.keys(CRITERION_CONFIG) as Criterion[]
  const criterionCounts = criterionKeys.map((key) => ({
    key,
    ...CRITERION_CONFIG[key],
    count: initiatives.filter((i) => i.criterion === key).length,
  }))

  // Feature request stats
  const requestStatuses = Object.keys(STATUS_LABELS)
  const requestStatusCounts = requestStatuses.map((s) => ({
    status: s,
    ...STATUS_LABELS[s],
    count: requests.filter((r) => r.status === s).length,
  }))

  const totalVotes = requests.reduce((sum, r) => sum + r.vote_count, 0)
  const avgVotes = requests.length > 0 ? Math.round(totalVotes / requests.length) : 0

  const insights = generateInsights(initiatives, levels, requests)

  return (
    <main className="min-h-screen bg-white p-8 max-w-5xl mx-auto">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">Stats & Analytics</h1>
      <p className="text-[13px] text-neutral-500 mb-8">Overview of roadmap composition and feature request activity.</p>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="Total initiatives" value={total} />
        <SummaryCard label="Active (Now)" value={columnCounts.find((c) => c.id === 'now')?.count ?? 0} color={COLUMN_COLORS.now} sublabel="In-progress work" />
        <SummaryCard label="Feature requests" value={requests.length} sublabel={`${totalVotes} total votes`} />
        <SummaryCard label="Avg votes / request" value={avgVotes} sublabel="Across all requests" />
      </div>

      {/* Column breakdown */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">By column</h2>
        <div className="space-y-2">
          {columnCounts.map((c) => (
            <Bar key={c.id} label={`${c.label} (${c.sublabel})`} count={c.count} total={total} color={c.color} />
          ))}
        </div>
      </section>

      {/* Strategic level breakdown */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">By strategic level</h2>
        <div className="space-y-2">
          {levelCounts.map((l) => (
            <Bar key={l.id} label={l.name} count={l.count} total={total} color={l.color} />
          ))}
        </div>
      </section>

      {/* Criterion breakdown */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">By criterion</h2>
        <div className="space-y-2">
          {criterionCounts.map((c) => (
            <Bar key={c.key} label={c.label} count={c.count} total={total} color={c.border} />
          ))}
        </div>
      </section>

      {/* Effort distribution */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-1">Effort distribution</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Based on initiatives with an effort estimate set.</p>
        {(() => {
          const effortKeys = Object.keys(EFFORT_CONFIG)
          const withEffort = initiatives.filter((i) => i.effort)
          const effortTotal = withEffort.length
          const effortCounts = effortKeys.map((k) => ({
            key: k,
            ...EFFORT_CONFIG[k],
            count: initiatives.filter((i) => i.effort === k).length,
          }))
          const activeColumns = COLUMNS.filter((c) => c.id !== 'parked')

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  {effortCounts.map((e) => (
                    <Bar key={e.key} label={e.label} count={e.count} total={effortTotal || 1} color={e.color} />
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 mt-2">
                  {total - effortTotal} of {total} initiatives have no effort estimate set.
                </p>
              </div>
              <div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200">
                      <th className="py-2 text-left font-medium">Effort</th>
                      {activeColumns.map((c) => (
                        <th key={c.id} className="py-2 text-center font-medium">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {effortKeys.map((ek) => (
                      <tr key={ek} className="border-b border-neutral-100">
                        <td className="py-2 font-medium text-neutral-600">{EFFORT_CONFIG[ek].label}</td>
                        {activeColumns.map((c) => {
                          const count = initiatives.filter((i) => i.effort === ek && i.column === c.id).length
                          const isRisk = (ek === 'l' || ek === 'xl') && c.id === 'now' && count > 0
                          return (
                            <td
                              key={c.id}
                              className="py-2 text-center text-neutral-600"
                              style={isRisk ? { backgroundColor: '#fef3c7' } : undefined}
                            >
                              {count}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </section>

      {/* Confidence matrix */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-1">Confidence matrix</h2>
        <p className="text-[12px] text-neutral-400 mb-4">
          Each initiative plotted by confidence in the problem (x-axis) vs confidence in the solution (y-axis). Items in the bottom-left need research before sequencing.
        </p>
        {(() => {
          const rated = initiatives.filter((i) => i.confidence_problem != null && i.confidence_solution != null)
          const unrated = initiatives.length - rated.length

          const quadrantLabel = (x: 'low' | 'high', y: 'low' | 'high') => {
            if (x === 'low' && y === 'high') return { label: 'Solution looking for a problem', bg: '#fef3c7' }
            if (x === 'high' && y === 'high') return { label: 'Ready to build', bg: '#dcfce7' }
            if (x === 'low' && y === 'low') return { label: 'Needs research', bg: '#fee2e2' }
            return { label: 'Know the problem, need the approach', bg: '#dbeafe' }
          }

          function getQuadrant(p: number, s: number): { x: 'low' | 'high'; y: 'low' | 'high' } {
            return { x: p <= 3 ? 'low' : 'high', y: s <= 3 ? 'low' : 'high' }
          }

          function dotPosition(val: number, isLow: boolean): number {
            // Within a quadrant, position the dot based on actual value
            if (isLow) {
              if (val <= 1) return 20
              if (val <= 2) return 45
              return 70
            } else {
              if (val <= 4) return 30
              return 65
            }
          }

          const quadrants: { x: 'low' | 'high'; y: 'low' | 'high' }[] = [
            { x: 'low', y: 'high' }, { x: 'high', y: 'high' },
            { x: 'low', y: 'low' }, { x: 'high', y: 'low' },
          ]

          // Insight
          const needsResearch = rated.filter((i) => i.confidence_problem! <= 3 && i.confidence_solution! <= 3).length
          const readyToBuild = rated.filter((i) => i.confidence_problem! > 3 && i.confidence_solution! > 3).length
          let insight = 'Confidence scores are spread across the matrix.'
          if (rated.length > 0 && needsResearch / rated.length > 0.3) {
            insight = 'More than a third of the roadmap has low confidence on both axes. Consider whether these items should be in Research rather than Now or Next.'
          } else if (rated.length > 0 && readyToBuild / rated.length > 0.5) {
            insight = 'Most initiatives are high-confidence. The main constraint is capacity, not discovery.'
          }

          return (
            <div>
              {rated.length === 0 ? (
                <p className="text-[12px] text-neutral-400 italic">No initiatives have been rated yet. Add confidence scores in the initiative edit form.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-0 border border-neutral-200 rounded-lg overflow-hidden" style={{ maxWidth: 500 }}>
                    {quadrants.map((q) => {
                      const cfg = quadrantLabel(q.x, q.y)
                      const dots = rated.filter((i) => {
                        const quad = getQuadrant(i.confidence_problem!, i.confidence_solution!)
                        return quad.x === q.x && quad.y === q.y
                      })
                      return (
                        <div
                          key={`${q.x}-${q.y}`}
                          className="relative border border-neutral-100"
                          style={{ backgroundColor: cfg.bg + '60', minHeight: 120, padding: 8 }}
                        >
                          <span className="text-[10px] text-neutral-500 font-medium">{cfg.label}</span>
                          {dots.map((d) => (
                            <div
                              key={d.id}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: d.strategic_level_color || '#999',
                                left: `${dotPosition(d.confidence_problem!, q.x === 'low')}%`,
                                top: `${100 - dotPosition(d.confidence_solution!, q.y === 'high')}%`,
                              }}
                              title={`${d.title} · Problem: ${d.confidence_problem}/5 · Solution: ${d.confidence_solution}/5`}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2" style={{ maxWidth: 500 }}>
                    <span className="text-[10px] text-neutral-400">← Low problem confidence</span>
                    <span className="text-[10px] text-neutral-400">High problem confidence →</span>
                  </div>
                  {unrated > 0 && (
                    <p className="text-[11px] text-neutral-400 mt-2">{unrated} initiative{unrated !== 1 ? 's' : ''} not yet rated</p>
                  )}
                  <div className="flex items-start gap-2 text-[12px] text-neutral-500 mt-3">
                    <span className="text-amber-500 mt-0.5 shrink-0">●</span>
                    <span>{insight}</span>
                  </div>
                </>
              )}
            </div>
          )
        })()}
      </section>

      {/* Capacity planning */}
      <CapacitySection initiatives={initiatives} />

      {/* Monthly distribution */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-1">Target month distribution</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Based on initiatives with a target month set.</p>
        {(() => {
          const withMonth = initiatives.filter((i) => i.target_month)
          const monthTotal = withMonth.length
          const monthCounts = MONTHS_2026.map((m) => ({
            ...m,
            count: initiatives.filter((i) => i.target_month === m.value).length,
          }))
          const noMonth = total - monthTotal

          return (
            <div>
              <div className="space-y-2">
                {monthCounts.filter((m) => m.count > 0).map((m) => (
                  <Bar key={m.value} label={MONTH_SHORT[m.value] ?? m.label} count={m.count} total={monthTotal || 1} color="#50E88A" />
                ))}
                {monthTotal === 0 && (
                  <p className="text-[12px] text-neutral-400 italic">No initiatives have a target month set yet.</p>
                )}
              </div>
              {monthTotal > 0 && (
                <p className="text-[11px] text-neutral-400 mt-2">
                  {noMonth} of {total} initiatives have no target month set.
                </p>
              )}
            </div>
          )
        })()}
      </section>

      {/* Feature requests overview */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">Feature requests</h2>
        <div className="space-y-2">
          {requestStatusCounts.map((s) => (
            <Bar key={s.status} label={s.label} count={s.count} total={requests.length} color={s.color} />
          ))}
        </div>
      </section>

      {/* Target month mismatches */}
      {(() => {
        const mismatched = initiatives.filter(
          (i) => i.target_month && i.column !== 'parked' && i.column !== 'released' && !isMonthInColumnRange(i.target_month, i.column)
        )
        if (mismatched.length === 0) return null
        return (
          <section className="mb-8">
            <h2 className="text-[14px] font-semibold text-neutral-800 mb-1">Target month mismatches</h2>
            <p className="text-[12px] text-neutral-400 mb-4">
              Initiatives where the target month falls outside the column&apos;s typical range. Consider moving the card or updating the target month.
            </p>
            <div className="space-y-1.5">
              {mismatched.map((i) => {
                const col = COLUMNS.find((c) => c.id === i.column)
                return (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/50">
                    <span className="text-[10px] font-medium text-amber-600">⚠</span>
                    <span className="text-[12px] text-neutral-700 flex-1 truncate">{i.title}</span>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {MONTH_SHORT[i.target_month!]} in {col?.label ?? i.column}{col?.months ? ` (${col.months})` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* Insights */}
      <section className="mb-8">
        <h2 className="text-[14px] font-semibold text-neutral-800 mb-4">Insights</h2>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px] text-neutral-600">
              <span className="text-amber-500 mt-0.5 shrink-0">●</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
