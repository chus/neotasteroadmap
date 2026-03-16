'use client'

import { useState } from 'react'
import { testLinearConnection, pushToLinear, getAllLinearSyncLogs, runDriftDetection } from '@/app/actions'
import LinearImportModal from './LinearImportModal'
import type { Initiative, StrategicLevel, LinearSyncLogEntry } from '@/types'

interface Props {
  isConfigured: boolean
  initiatives: Initiative[]
  strategicLevels: StrategicLevel[]
  initialSyncLogs: LinearSyncLogEntry[]
  onInitiativeImported?: (initiative: Initiative) => void
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function LinearSettings({ isConfigured, initiatives, strategicLevels, initialSyncLogs, onInitiativeImported }: Props) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; teamName?: string; error?: string } | null>(null)
  const [bulkSyncing, setBulkSyncing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [syncLogs, setSyncLogs] = useState<LinearSyncLogEntry[]>(initialSyncLogs)
  const [logsOffset, setLogsOffset] = useState(20)
  const [loadingMore, setLoadingMore] = useState(false)
  const [driftChecking, setDriftChecking] = useState(false)
  const [driftResult, setDriftResult] = useState<string | null>(null)

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    const result = await testLinearConnection()
    setTestResult(result)
    setTesting(false)
  }

  async function handleBulkPush() {
    const syncEnabled = initiatives.filter((i) => i.linear_sync_enabled)
    if (syncEnabled.length === 0) {
      setBulkProgress('No initiatives have Linear sync enabled.')
      return
    }

    setBulkSyncing(true)
    let synced = 0
    for (const init of syncEnabled) {
      synced++
      setBulkProgress(`Syncing ${synced} of ${syncEnabled.length}…`)
      await pushToLinear(init.id)
    }
    setBulkProgress(`Done — ${synced} initiatives synced.`)
    setBulkSyncing(false)

    // Refresh logs
    const freshLogs = await getAllLinearSyncLogs(20, 0)
    setSyncLogs(freshLogs)
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    const more = await getAllLinearSyncLogs(20, logsOffset)
    setSyncLogs((prev) => [...prev, ...more])
    setLogsOffset((prev) => prev + 20)
    setLoadingMore(false)
  }

  return (
    <div className="mb-10">
      <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">Integrations</h2>
      <p className="text-[12px] text-neutral-400 mb-4">External tools connected to your roadmap.</p>

      {/* Linear card */}
      <div className="border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold text-white" style={{ backgroundColor: '#5E6AD2' }}>
              L
            </div>
            <div>
              <div className="text-[14px] font-semibold text-neutral-800">Linear</div>
              {isConfigured ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-neutral-500">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-neutral-500">Not configured</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>

        {testResult && (
          <div className={`text-[12px] mb-4 px-3 py-2 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {testResult.success
              ? `Connected · neotaste · ${testResult.teamName} team`
              : `Error: ${testResult.error}`}
          </div>
        )}

        {!isConfigured && (
          <p className="text-[12px] text-neutral-400 mb-4">
            Add <code className="text-[11px] bg-neutral-100 px-1 py-0.5 rounded">LINEAR_API_KEY</code> to your environment variables to enable Linear sync.
          </p>
        )}

        {isConfigured && (
          <>
            {/* Bulk actions */}
            <div className="border-t border-neutral-100 pt-4 mt-4">
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Bulk actions</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkPush}
                  disabled={bulkSyncing}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
                >
                  {bulkSyncing ? 'Syncing…' : 'Push all to Linear'}
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                >
                  Import from Linear
                </button>
                <button
                  onClick={async () => {
                    setDriftChecking(true)
                    setDriftResult(null)
                    const result = await runDriftDetection()
                    setDriftChecking(false)
                    setDriftResult(`Checked ${result.checked} · ${result.drifted} drift${result.drifted !== 1 ? 's' : ''} found${result.errors > 0 ? ` · ${result.errors} errors` : ''}`)
                    const freshLogs = await getAllLinearSyncLogs(20, 0)
                    setSyncLogs(freshLogs)
                  }}
                  disabled={driftChecking}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
                >
                  {driftChecking ? 'Checking...' : 'Run drift check'}
                </button>
              </div>
              {bulkProgress && (
                <p className="text-[11px] text-neutral-500 mt-2">{bulkProgress}</p>
              )}
              {driftResult && (
                <p className="text-[11px] text-neutral-500 mt-2">{driftResult}</p>
              )}
            </div>

            {/* Sync log table */}
            {syncLogs.length > 0 && (
              <div className="border-t border-neutral-100 pt-4 mt-4">
                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Sync log</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200">
                        <th className="py-1.5 text-left font-medium">Initiative</th>
                        <th className="py-1.5 text-left font-medium">Dir</th>
                        <th className="py-1.5 text-left font-medium">Status</th>
                        <th className="py-1.5 text-left font-medium">Changes</th>
                        <th className="py-1.5 text-left font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((entry) => (
                        <tr key={entry.id} className="border-b border-neutral-100">
                          <td className="py-1.5 text-neutral-700 truncate max-w-[160px]">{entry.initiative_title || '—'}</td>
                          <td className="py-1.5">{entry.direction === 'push' ? '↑' : '↓'}</td>
                          <td className="py-1.5">
                            <span className={`w-1.5 h-1.5 inline-block rounded-full ${entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                          </td>
                          <td className="py-1.5 text-neutral-500 truncate max-w-[200px]">
                            {entry.changes || entry.error_message || '—'}
                          </td>
                          <td className="py-1.5 text-neutral-400">{timeAgo(new Date(entry.created_at))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 mt-2"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import modal */}
      {showImportModal && (
        <LinearImportModal
          strategicLevels={strategicLevels}
          initiatives={initiatives}
          onImported={(init) => {
            onInitiativeImported?.(init)
            setShowImportModal(false)
          }}
          onLinked={() => {
            setShowImportModal(false)
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
