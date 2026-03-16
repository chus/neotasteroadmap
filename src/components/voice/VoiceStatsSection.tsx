import Link from 'next/link'

interface Props {
  health: {
    totalSubmissions: number
    totalClusters: number
    openClusters: number
    responseRate: number
    backlogItems: number
    promotedToRoadmap: number
    researchCandidates: number
  }
  clusterVelocity: {
    clusterId: string
    clusterTitle: string
    weeklyCounts: { week: string; count: number }[]
    trend: 'growing' | 'stable' | 'declining'
  }[]
}

export default function VoiceStatsSection({ health, clusterVelocity }: Props) {
  const growing = clusterVelocity.filter((c) => c.trend === 'growing').slice(0, 3)

  const healthStatus = health.responseRate >= 70
    ? { label: 'Healthy', color: '#085041', bg: '#E1F5EE' }
    : health.responseRate >= 40
    ? { label: 'Response rate low', color: '#92400E', bg: '#FEF3C7' }
    : { label: '30-day commitment at risk', color: '#DC2626', bg: '#FEE2E2' }

  return (
    <div className="max-w-5xl mx-auto px-8 pb-8 -mt-4">
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-neutral-800">Voice feedback</h2>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: healthStatus.color, backgroundColor: healthStatus.bg }}
            >
              {healthStatus.label}
            </span>
            <Link href="/feedback/trends" className="text-[11px] text-neutral-400 hover:text-neutral-600">
              View full trends &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[18px] font-semibold text-neutral-800">{health.totalSubmissions}</div>
            <div className="text-[11px] text-neutral-400">Total submissions</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[18px] font-semibold text-neutral-800">{health.openClusters}</div>
            <div className="text-[11px] text-neutral-400">Active clusters</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[18px] font-semibold text-neutral-800">{growing.length}</div>
            <div className="text-[11px] text-neutral-400">Growing themes</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <div className="text-[18px] font-semibold text-neutral-800">{health.researchCandidates}</div>
            <div className="text-[11px] text-neutral-400">Research candidates</div>
          </div>
        </div>

        {growing.length > 0 && (
          <div className="space-y-1.5">
            {growing.map((cluster) => {
              const lastWeek = cluster.weeklyCounts.slice(-1)[0]?.count ?? 0
              return (
                <div key={cluster.clusterId} className="flex items-center gap-3 px-3 py-2 border border-neutral-200 rounded-lg">
                  <span className="text-[12px] text-neutral-700 flex-1 truncate">{cluster.clusterTitle}</span>
                  <span className="text-[11px] text-green-600 shrink-0">+{lastWeek} this week</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
