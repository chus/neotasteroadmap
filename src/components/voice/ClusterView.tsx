'use client'

import { useState } from 'react'
import {
  getClusters,
  updateCluster,
  runClustering,
  graduateClusterToBacklog,
  createClusterManually,
} from '@/app/feedback-actions'
import ClusterSlideOver from './ClusterSlideOver'
import type { FeedbackCluster, ClusterStatus } from '@/types'

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
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [runningClustering, setRunningClustering] = useState(false)
  const [clusterResult, setClusterResult] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createArea, setCreateArea] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleRunClustering() {
    setRunningClustering(true)
    setClusterResult(null)
    const result = await runClustering()
    setClusterResult(`Created ${result.clustersCreated} clusters, assigned ${result.submissionsAssigned} submissions`)
    const updated = await getClusters()
    setClusters(updated)
    setRunningClustering(false)
  }

  async function refreshClusters() {
    const updated = await getClusters()
    setClusters(updated)
  }

  async function handleCreateCluster() {
    if (!createTitle.trim()) return
    setCreating(true)
    await createClusterManually(createTitle, createDesc, createArea || undefined)
    setCreating(false)
    setShowCreateModal(false)
    setCreateTitle('')
    setCreateDesc('')
    setCreateArea('')
    await refreshClusters()
  }

  const filtered = showArchived
    ? clusters.filter(c => c.is_archived)
    : clusters.filter(c => !c.is_archived)

  const archivedCount = clusters.filter(c => c.is_archived).length
  const selectedCluster = clusters.find(c => c.id === selectedClusterId)

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={handleRunClustering}
          disabled={runningClustering}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
        >
          {runningClustering ? 'Clustering...' : 'Run clustering'}
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          + Create cluster
        </button>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              showArchived
                ? 'bg-neutral-800 text-white border-neutral-800'
                : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Archived ({archivedCount})
          </button>
        )}
        {clusterResult && (
          <span className="text-[11px] text-green-600">{clusterResult}</span>
        )}
        <span className="text-[11px] text-neutral-400 ml-auto">
          {filtered.length} cluster{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-[11px] text-neutral-400 mb-4">
        Click a cluster to view details, manage submissions, merge, or split.
      </p>

      {/* Cluster cards */}
      <div className="space-y-2">
        {filtered.map((cluster) => {
          const statusCfg = STATUS_CONFIG[cluster.status] ?? STATUS_CONFIG.active
          const qualityAvg = cluster.avg_quality_score
          const lastSubDays = cluster.last_submission_at
            ? Math.floor((Date.now() - new Date(cluster.last_submission_at).getTime()) / (1000 * 60 * 60 * 24))
            : null

          return (
            <button
              key={cluster.id}
              onClick={() => setSelectedClusterId(cluster.id)}
              className="w-full text-left border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 transition-colors"
              style={{ opacity: cluster.is_archived ? 0.7 : 1 }}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {cluster.avg_sentiment && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SENTIMENT_DOT[cluster.avg_sentiment] ?? '#999' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-neutral-800 truncate">
                      {cluster.label}
                    </span>
                    {cluster.created_by === 'manual' && (
                      <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">
                        manual
                      </span>
                    )}
                  </div>
                  {/* Health indicators */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-neutral-400">
                      {cluster.submission_count} sub{cluster.submission_count !== 1 ? 's' : ''}
                    </span>
                    {qualityAvg != null && (
                      <span className="text-[10px] text-neutral-400">
                        quality {qualityAvg.toFixed(1)}
                      </span>
                    )}
                    {cluster.research_optin_count > 0 && (
                      <span className="text-[10px] text-green-600">
                        🔬 {cluster.research_optin_count}
                      </span>
                    )}
                    {lastSubDays != null && (
                      <span className={`text-[10px] ${lastSubDays > 30 ? 'text-red-400' : lastSubDays > 7 ? 'text-amber-500' : 'text-neutral-400'}`}>
                        last {lastSubDays}d ago
                      </span>
                    )}
                  </div>
                </div>
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
                {cluster.is_archived && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                    Archived
                  </span>
                )}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-neutral-300 shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-neutral-400 text-center py-12 italic">
            {showArchived ? 'No archived clusters.' : 'No clusters yet. Submit some feedback and run clustering to see themes emerge.'}
          </p>
        )}
      </div>

      {/* Slide-over */}
      {selectedCluster && (
        <ClusterSlideOver
          cluster={selectedCluster}
          allClusters={clusters}
          onClose={() => setSelectedClusterId(null)}
          onUpdate={refreshClusters}
        />
      )}

      {/* Create cluster modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-5">
            <h3 className="text-[15px] font-semibold text-neutral-800 mb-4">Create cluster manually</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Title</label>
                <input
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  className="mt-1 w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A]"
                  placeholder="Cluster title..."
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Description</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  rows={3}
                  className="mt-1 w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A]"
                  placeholder="What this cluster is about..."
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Strategic area (optional)</label>
                <input
                  value={createArea}
                  onChange={e => setCreateArea(e.target.value)}
                  className="mt-1 w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A]"
                  placeholder="e.g. Discovery, Retention..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[12px] text-neutral-500 hover:text-neutral-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCluster}
                disabled={!createTitle.trim() || creating}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-40"
                style={{ backgroundColor: '#0D2818' }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
