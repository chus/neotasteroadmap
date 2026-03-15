'use client'

import { COLUMNS, CRITERION_CONFIG, EFFORT_CONFIG, MONTHS_2026, MONTH_SHORT } from '@/lib/constants'
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
