'use client'

import { useState } from 'react'
import {
  getClusters,
  getClusterSubmissions,
  updateCluster,
  runClustering,
  graduateClusterToBacklog,
} from '@/app/feedback-actions'
import type { FeedbackCluster, FeedbackSubmission, ClusterStatus } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:     { label: 'Active',     color: '#0C447C', bg: '#E6F1FB' },
  resolved:   { label: 'Resolved',   color: '#085041', bg: '#E1F5EE' },
  watching:   { label: 'Watching',   color: '#633806', bg: '#FAEEDA' },
  planned:    { label: 'Planned',    color: '#3C3489', bg: '#EEEDFE' },
  monitoring: { label: 'Monitoring', color: '#633806', bg: '#FAEEDA' },
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
}

interface Props {
  initialClusters: FeedbackCluster[]
}

export default function ClusterView({ initialClusters }: Props) {
  const [clusters, setClusters] = useState(initialClusters)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedSubs, setExpandedSubs] = useState<FeedbackSubmission[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [runningClustering, setRunningClustering] = useState(false)
  const [clusterResult, setClusterResult] = useState<string | null>(null)
  const [graduatingId, setGraduatingId] = useState<string | null>(null)

  async function handleExpand(clusterId: string) {
    if (expandedId === clusterId) {
      setExpandedId(null)
      return
    }
    setExpandedId(clusterId)
    setLoadingSubs(true)
    const subs = await getClusterSubmissions(clusterId)
    setExpandedSubs(subs)
    setLoadingSubs(false)
  }

  async function handleRunClustering() {
    setRunningClustering(true)
    setClusterResult(null)
    const result = await runClustering()
    setClusterResult(`Created ${result.clustersCreated} clusters, assigned ${result.submissionsAssigned} submissions`)
    const updated = await getClusters()
    setClusters(updated)
    setRunningClustering(false)
  }

  async function handleStatusChange(id: string, status: ClusterStatus) {
    await updateCluster(id, { status })
    setClusters(clusters.map((c) => c.id === id ? { ...c, status } : c))
  }

  async function handleGraduateToBacklog(clusterId: string, status: 'backlog' | 'watching') {
    setGraduatingId(clusterId)
    const watchUntil = status === 'watching'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined
    const item = await graduateClusterToBacklog(clusterId, status, watchUntil)
    if (item) {
      setClusters(clusters.map((c) => c.id === clusterId ? {
        ...c,
        backlog_item_id: item.id,
        status: (status === 'watching' ? 'monitoring' : 'planned') as ClusterStatus,
      } : c))
    }
    setGraduatingId(null)
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleRunClustering}
          disabled={runningClustering}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
        >
          {runningClustering ? 'Clustering...' : 'Run clustering'}
        </button>
        {clusterResult && (
          <span className="text-[11px] text-green-600">{clusterResult}</span>
        )}
        <span className="text-[11px] text-neutral-400 ml-auto">
          {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Note about backlog flow */}
      <p className="text-[11px] text-neutral-400 mb-4">
        Items go to the problem backlog first, then to the roadmap.
      </p>

      {/* Cluster cards */}
      <div className="space-y-2">
        {clusters.map((cluster) => {
          const statusCfg = STATUS_CONFIG[cluster.status] ?? STATUS_CONFIG.active
          const isExpanded = expandedId === cluster.id
          const hasBacklog = !!cluster.backlog_item_id
          return (
            <div key={cluster.id} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleExpand(cluster.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                {cluster.avg_sentiment && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SENTIMENT_DOT[cluster.avg_sentiment] ?? '#999' }}
                  />
                )}
                <span className="text-[13px] font-medium text-neutral-800 flex-1 truncate">
                  {cluster.label}
                </span>
                <span className="text-[11px] text-neutral-400 shrink-0">
                  {cluster.submission_count} submission{cluster.submission_count !== 1 ? 's' : ''}
                </span>
                {cluster.top_urgency && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    cluster.top_urgency === 'high' ? 'bg-red-100 text-red-700' :
                    cluster.top_urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {cluster.top_urgency}
                  </span>
                )}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-neutral-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-neutral-100">
                  {/* Actions */}
                  <div className="flex items-center gap-2 py-3 flex-wrap">
                    {!hasBacklog ? (
                      <>
                        <select
                          value={cluster.status}
                          onChange={(e) => handleStatusChange(cluster.id, e.target.value as ClusterStatus)}
                          className="text-[11px] font-medium px-2 py-1 rounded border border-neutral-200 bg-white outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="watching">Watching</option>
                          <option value="resolved">Resolved</option>
                        </select>

                        <button
                          onClick={() => handleGraduateToBacklog(cluster.id, 'backlog')}
                          disabled={graduatingId === cluster.id}
                          className="text-[11px] font-medium px-2.5 py-1 rounded border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-40"
                        >
                          {graduatingId === cluster.id ? 'Graduating...' : 'Add to backlog'}
                        </button>

                        <button
                          onClick={() => handleGraduateToBacklog(cluster.id, 'watching')}
                          disabled={graduatingId === cluster.id}
                          className="text-[11px] font-medium px-2.5 py-1 rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40"
                        >
                          Watch for 30 days
                        </button>
                      </>
                    ) : (
                      <a
                        href="/feedback/backlog"
                        className="text-[11px] font-medium px-2.5 py-1 rounded border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        View in backlog &rarr;
                      </a>
                    )}
                  </div>

                  {/* Submissions list */}
                  {loadingSubs ? (
                    <p className="text-[12px] text-neutral-400 py-4">Loading submissions...</p>
                  ) : (
                    <div className="space-y-1">
                      {expandedSubs.map((sub) => (
                        <div key={sub.id} className="flex items-start gap-2 px-3 py-2 bg-neutral-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-neutral-700 truncate">{sub.title}</p>
                            <p className="text-[11px] text-neutral-500 line-clamp-2">{sub.body}</p>
                          </div>
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {sub.name}
                          </span>
                        </div>
                      ))}
                      {expandedSubs.length === 0 && (
                        <p className="text-[12px] text-neutral-400 italic py-2">No submissions in this cluster.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {clusters.length === 0 && (
          <p className="text-[13px] text-neutral-400 text-center py-12 italic">
            No clusters yet. Submit some feedback and run clustering to see themes emerge.
          </p>
        )}
      </div>
    </div>
  )
}
