'use client'

import { useState } from 'react'
import { triggerAgentManually } from '@/app/feedback-actions'
import type { AgentRunLogEntry } from '@/types'

interface Props {
  initialRuns: AgentRunLogEntry[]
}

export default function AgentHistory({ initialRuns }: Props) {
  const [runs, setRuns] = useState(initialRuns)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  async function handleRunNow() {
    setRunning(true)
    setRunResult(null)
    try {
      const report = await triggerAgentManually()
      setRunResult(JSON.stringify(report, null, 2))
      window.location.reload()
    } catch {
      setRunResult('Agent run failed — check server logs')
    }
    setRunning(false)
  }

  function parseReport(reportJson: string) {
    try {
      return JSON.parse(reportJson)
    } catch {
      return null
    }
  }

  return (
    <div>
      {/* Run now */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleRunNow}
          disabled={running}
          className="text-[12px] font-medium px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
        >
          {running ? 'Running agent...' : 'Run now'}
        </button>
        <span className="text-[11px] text-neutral-400">
          Triggers the daily agent manually. Uses the same logic as the 06:00 UTC cron.
        </span>
      </div>

      {runResult && (
        <div className="mb-6 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-2">Latest run result</div>
          <pre className="text-[11px] text-neutral-600 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
            {runResult}
          </pre>
        </div>
      )}

      {/* Run history */}
      <div className="space-y-2">
        {runs.map((run) => {
          const report = parseReport(run.report)
          const isExpanded = expandedId === run.id

          return (
            <div key={run.id} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : run.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-[13px] font-medium text-neutral-800">
                  {run.run_date}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {report?.newSubmissions ?? 0} submissions
                </span>
                <span className="text-[11px] text-neutral-400">
                  {report?.anomalies?.length ?? 0} anomalies
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  run.slack_posted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {run.slack_posted ? 'Slack posted' : 'No Slack'}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-neutral-400 shrink-0 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-neutral-100">
                  <pre className="text-[11px] text-neutral-600 whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto mt-3 bg-neutral-50 rounded-lg p-3">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
        {runs.length === 0 && (
          <p className="text-[13px] text-neutral-400 text-center py-12">
            No agent runs yet. Click &quot;Run now&quot; or wait for the daily cron at 06:00 UTC.
          </p>
        )}
      </div>
    </div>
  )
}
