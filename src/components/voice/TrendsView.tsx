'use client'

const AREA_COLORS: Record<string, string> = {
  Discovery: '#378ADD',
  Churn: '#D85A30',
  'Trial conversion': '#7F77DD',
  Partner: '#1D9E75',
  Other: '#888780',
}

const AREAS = ['Discovery', 'Churn', 'Trial conversion', 'Partner', 'Other'] as const

interface TrendData {
  weeklyByArea: Record<string, unknown>[]
  clusterVelocity: {
    clusterId: string
    clusterTitle: string
    weeklyCounts: { week: string; count: number }[]
    trend: 'growing' | 'stable' | 'declining'
  }[]
  qualityOverTime: { week: string; avgScore: number; total: number }[]
  health: {
    totalSubmissions: number
    totalClusters: number
    openClusters: number
    responseRate: number
    backlogItems: number
    promotedToRoadmap: number
    researchCandidates: number
  }
  backlogFlow: {
    graduated_last_30: number
    promoted_last_30: number
    declined_last_30: number
    currently_watching: number
    currently_backlog: number
  }
}

export default function TrendsView({ data }: { data: TrendData }) {
  const maxWeeklyTotal = Math.max(
    ...data.weeklyByArea.map((w) =>
      AREAS.reduce((sum, area) => sum + ((w[area] as number) ?? 0), 0)
    ),
    1,
  )

  // Growing clusters
  const growing = data.clusterVelocity
    .filter((c) => c.trend === 'growing')
    .sort((a, b) => {
      const deltaA = a.weeklyCounts.slice(-1)[0]?.count ?? 0
      const deltaB = b.weeklyCounts.slice(-1)[0]?.count ?? 0
      return deltaB - deltaA
    })
    .slice(0, 5)

  const maxClusterCount = Math.max(...growing.map((c) =>
    c.weeklyCounts.reduce((sum, w) => sum + w.count, 0)
  ), 1)

  // Quality trend
  const recentQuality = data.qualityOverTime.filter((w) => w.total > 0)
  const lastFourQuality = recentQuality.slice(-4)
  const prevFourQuality = recentQuality.slice(-8, -4)
  const lastAvgQ = lastFourQuality.length > 0 ? lastFourQuality.reduce((s, w) => s + w.avgScore, 0) / lastFourQuality.length : 0
  const prevAvgQ = prevFourQuality.length > 0 ? prevFourQuality.reduce((s, w) => s + w.avgScore, 0) / prevFourQuality.length : 0
  const qualityTrending = lastAvgQ < prevAvgQ - 0.3 ? 'down' : lastAvgQ > prevAvgQ + 0.3 ? 'up' : 'stable'
  const maxQuality = 5

  return (
    <div className="space-y-10">
      {/* Section 1 — Weekly by area */}
      <section>
        <h2 className="text-[15px] font-semibold text-neutral-800 mb-1">What users are talking about — over time</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Stacked weekly submissions by strategic area</p>

        {data.weeklyByArea.length > 0 ? (
          <>
            <div className="flex items-end gap-1" style={{ height: 160 }}>
              {data.weeklyByArea.map((week, i) => {
                const total = AREAS.reduce((sum, area) => sum + ((week[area] as number) ?? 0), 0)
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                    <div className="flex flex-col" style={{ height: `${(total / maxWeeklyTotal) * 100}%`, minHeight: total > 0 ? 2 : 1 }}>
                      {AREAS.map((area) => {
                        const count = (week[area] as number) ?? 0
                        if (count === 0) return null
                        return (
                          <div
                            key={area}
                            title={`${area}: ${count} submissions`}
                            style={{
                              flex: count,
                              backgroundColor: AREA_COLORS[area],
                              minHeight: 1,
                            }}
                          />
                        )
                      })}
                    </div>
                    <div className="text-[9px] text-neutral-300 text-center mt-1 truncate">
                      W{(week.week as string)?.split('-')[1]}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              {AREAS.map((area) => (
                <div key={area} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: AREA_COLORS[area] }} />
                  <span className="text-[10px] text-neutral-500">{area}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-neutral-400 italic py-8 text-center">No submission data yet.</p>
        )}
      </section>

      {/* Section 2 — Growing clusters */}
      <section>
        <h2 className="text-[15px] font-semibold text-neutral-800 mb-1">Themes gaining momentum</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Top growing clusters by recent activity</p>

        {growing.length >= 1 ? (
          <div className="space-y-2">
            {growing.map((cluster) => {
              const total = cluster.weeklyCounts.reduce((s, w) => s + w.count, 0)
              const lastWeek = cluster.weeklyCounts.slice(-1)[0]?.count ?? 0
              return (
                <div key={cluster.clusterId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-neutral-800 truncate">{cluster.clusterTitle}</span>
                      <span className="text-[11px] text-green-600 shrink-0">+{lastWeek} this week</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(total / maxClusterCount) * 100}%`,
                          backgroundColor: '#10B981',
                        }}
                      />
                    </div>
                  </div>
                  <a href="/feedback" className="text-[10px] text-neutral-400 hover:text-neutral-600 shrink-0">
                    View &rarr;
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[12px] text-neutral-400 italic">No significant growth trends — submission patterns are stable.</p>
        )}
      </section>

      {/* Section 3 — Cluster velocity mini charts */}
      <section>
        <h2 className="text-[15px] font-semibold text-neutral-800 mb-1">Cluster activity over time</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Submission trends for top clusters (last 12 weeks)</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.clusterVelocity.slice(0, 6).map((cluster) => {
            const counts = cluster.weeklyCounts.slice(-8)
            const maxCount = Math.max(...counts.map((w) => w.count), 1)
            const trendColor = cluster.trend === 'growing' ? '#10B981' : cluster.trend === 'declining' ? '#EF4444' : '#9CA3AF'

            return (
              <div key={cluster.clusterId} className="border border-neutral-200 rounded-lg p-3">
                <div className="flex items-end gap-px" style={{ height: 50 }}>
                  {counts.map((week, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${Math.max((week.count / maxCount) * 100, 4)}%`,
                        backgroundColor: i === counts.length - 1 ? trendColor : '#E5E7EB',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trendColor }} />
                  <span className="text-[11px] text-neutral-600 truncate">{cluster.clusterTitle}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 4 — Quality over time */}
      <section>
        <h2 className="text-[15px] font-semibold text-neutral-800 mb-1">Signal quality</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Average AI quality score per week. Higher = more specific and actionable.</p>

        {recentQuality.length > 0 ? (
          <>
            <div className="relative" style={{ height: 80 }}>
              {/* Reference line at 3.0 */}
              <div
                className="absolute w-full border-t border-dashed border-neutral-300"
                style={{ bottom: `${(3.0 / maxQuality) * 100}%` }}
              >
                <span className="text-[9px] text-neutral-300 absolute -top-3 right-0">3.0</span>
              </div>
              <div className="flex items-end gap-1 h-full">
                {data.qualityOverTime.map((week, i) => {
                  const color = week.avgScore > 3.5 ? '#10B981' : week.avgScore >= 2.5 ? '#F59E0B' : '#EF4444'
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      title={`W${week.week.split('-')[1]}: ${week.avgScore} avg (${week.total} submissions)`}
                      style={{
                        height: week.total > 0 ? `${(week.avgScore / maxQuality) * 100}%` : '2%',
                        backgroundColor: week.total > 0 ? color : '#E5E7EB',
                        minHeight: 2,
                      }}
                    />
                  )
                })}
              </div>
            </div>

            {qualityTrending === 'down' && (
              <div className="mt-3 border border-amber-200 rounded-lg p-3 bg-amber-50">
                <p className="text-[12px] text-amber-700">
                  Submission quality has dropped over the last 4 weeks. Consider updating the form prompt or adding a more specific example in the placeholder text.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-[12px] text-neutral-400 italic py-4 text-center">Not enough data yet.</p>
        )}
      </section>

      {/* Section 5 — System health */}
      <section>
        <h2 className="text-[15px] font-semibold text-neutral-800 mb-1">How the system is performing</h2>
        <p className="text-[12px] text-neutral-400 mb-4">Key metrics across the Voice feedback pipeline</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold text-neutral-800">{data.health.totalSubmissions}</div>
            <div className="text-[11px] text-neutral-400">Total submissions</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold text-neutral-800">{data.health.openClusters}</div>
            <div className="text-[11px] text-neutral-400">Active clusters</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold" style={{
              color: data.health.responseRate >= 70 ? '#085041' : data.health.responseRate >= 40 ? '#92400E' : '#DC2626',
            }}>
              {data.health.responseRate}%
            </div>
            <div className="text-[11px] text-neutral-400">Response rate</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold text-neutral-800">{data.health.backlogItems}</div>
            <div className="text-[11px] text-neutral-400">Backlog items</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold text-green-700">{data.health.promotedToRoadmap}</div>
            <div className="text-[11px] text-neutral-400">Promoted to roadmap</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[20px] font-semibold text-neutral-800">{data.health.researchCandidates}</div>
            <div className="text-[11px] text-neutral-400">Research candidates</div>
          </div>
        </div>

        {/* Backlog flow */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-3">Backlog flow (last 30 days)</div>
          <div className="flex items-center justify-center gap-2 text-[12px]">
            <span className="text-neutral-400">Graduated</span>
            <span className="font-semibold text-neutral-800">{data.backlogFlow.graduated_last_30}</span>
            <span className="text-neutral-300">&rarr;</span>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="text-amber-600 font-semibold">{data.backlogFlow.currently_watching}</span>
                <div className="text-[10px] text-neutral-400">Watching</div>
              </div>
              <div className="text-center">
                <span className="text-purple-600 font-semibold">{data.backlogFlow.currently_backlog}</span>
                <div className="text-[10px] text-neutral-400">Backlog</div>
              </div>
            </div>
            <span className="text-neutral-300">&rarr;</span>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="text-green-600 font-semibold">{data.backlogFlow.promoted_last_30}</span>
                <div className="text-[10px] text-neutral-400">Promoted</div>
              </div>
              <div className="text-center">
                <span className="text-neutral-400 font-semibold">{data.backlogFlow.declined_last_30}</span>
                <div className="text-[10px] text-neutral-400">Declined</div>
              </div>
            </div>
          </div>
        </div>

        {data.health.responseRate < 50 && (
          <div className="mt-3 border border-red-200 rounded-lg p-3 bg-red-50">
            <p className="text-[12px] text-red-700">
              Less than half of clusters have received a user response. The 30-day commitment is at risk — review the cluster backlog.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
