'use client'

import { useState } from 'react'
import { triggerAgentManually, getAgentRunEvents } from '@/app/feedback-actions'
import type { AgentRunLogEntry, AgentRunEvent } from '@/types'

const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  assigned:          { label: 'Assigned',       color: '#10B981' },
  created_cluster:   { label: 'New cluster',    color: '#3B82F6' },
  flagged:           { label: 'Flagged',        color: '#F59E0B' },
  anomaly:           { label: 'Anomaly',        color: '#EF4444' },
  merge_suggested:   { label: 'Merge suggest',  color: '#8B5CF6' },
  skipped:           { label: 'Skipped',        color: '#9CA3AF' },
  error:             { label: 'Error',          color: '#EF4444' },
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: '#DC2626', bg: '#FEE2E2' },
  medium: { label: 'Medium', color: '#D97706', bg: '#FEF3C7' },
  low:    { label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
}

interface Props {
  initialRuns: AgentRunLogEntry[]
}

export default function AgentHistory({ initialRuns }: Props) {
  const [runs, setRuns] = useState(initialRuns)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [events, setEvents] = useState<Record<string, AgentRunEvent[]>>({})
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null)

  async function handleRunNow() {
    setRunning(true)
    setRunResult(null)
    try {
      const report = await triggerAgentManually()
      setRunResult(`Processed ${(report as { newSubmissions?: number }).newSubmissions ?? 0} submissions`)
      window.location.reload()
    } catch {
      setRunResult('Agent run failed — check server logs')
    }
    setRunning(false)
  }

  async function handleExpand(runId: string) {
    if (expandedId === runId) {
      setExpandedId(null)
      return
    }
    setExpandedId(runId)
    if (!events[runId]) {
      setLoadingEvents(runId)
      const runEvents = await getAgentRunEvents(runId)
      setEvents(prev => ({ ...prev, [runId]: runEvents }))
      setLoadingEvents(null)
    }
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
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-1">Latest run</div>
          <p className="text-[12px] text-neutral-600">{runResult}</p>
        </div>
      )}

      {/* Run history */}
      <div className="space-y-2">
        {runs.map((run) => {
          const report = parseReport(run.report)
          const isExpanded = expandedId === run.id
          const hasAnomalies = (report?.anomalies?.length ?? 0) > 0
          const runEvents = events[run.id] ?? []

          return (
            <div
              key={run.id}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: hasAnomalies ? '#FBBF24' : '#e5e5e5' }}
            >
              {/* Collapsed summary strip */}
              <button
                onClick={() => handleExpand(run.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-[13px] font-medium text-neutral-800">
                  {run.run_date}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                  {report?.newSubmissions ?? 0} processed
                </span>
                {(report?.newClusters ?? 0) > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                    {report.newClusters} new clusters
                  </span>
                )}
                {hasAnomalies && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    {report.anomalies.length} anomal{report.anomalies.length !== 1 ? 'ies' : 'y'}
                  </span>
                )}
                {(report?.mergeSuggestions?.length ?? 0) > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                    {report.mergeSuggestions.length} merge suggestion{report.mergeSuggestions.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                  run.slack_posted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {run.slack_posted ? 'Slack' : 'No Slack'}
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
                  {/* Narrative */}
                  {report?.narrative && (
                    <div className="mt-3 mb-4 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                      <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Summary</div>
                      <p className="text-[13px] text-neutral-700 leading-relaxed">{report.narrative}</p>
                    </div>
                  )}

                  {/* Event timeline */}
                  {loadingEvents === run.id ? (
                    <p className="text-[12px] text-neutral-400 py-3">Loading events...</p>
                  ) : runEvents.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Event log</div>
                      <div className="space-y-1.5">
                        {runEvents.map((event) => {
                          const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.assigned
                          const confPct = event.confidence != null ? Math.round(event.confidence * (event.confidence > 1 ? 1 : 100)) : null

                          return (
                            <div key={event.id} className="flex items-start gap-2.5 py-1">
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                style={{ backgroundColor: cfg.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-medium uppercase tracking-wider mr-2" style={{ color: cfg.color }}>
                                  {cfg.label}
                                </span>
                                {confPct != null && (
                                  <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${
                                    confPct > 85 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {confPct}% match
                                  </span>
                                )}
                                {event.severity && (
                                  <span
                                    className="text-[9px] font-medium px-1 py-0.5 rounded ml-1"
                                    style={{
                                      backgroundColor: SEVERITY_CONFIG[event.severity]?.bg ?? '#F3F4F6',
                                      color: SEVERITY_CONFIG[event.severity]?.color ?? '#6B7280',
                                    }}
                                  >
                                    {SEVERITY_CONFIG[event.severity]?.label ?? event.severity}
                                  </span>
                                )}
                                <p className="text-[12px] text-neutral-600 mt-0.5 leading-relaxed">{event.rationale}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    // Fallback: show report data for older runs without events
                    <div className="mt-3">
                      <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Report data</div>

                      {/* Anomalies */}
                      {report?.anomalies?.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wide mb-1">Anomalies</div>
                          {report.anomalies.map((a: { description: string; severity: string }, i: number) => (
                            <div key={i} className="flex items-start gap-2 py-1 px-2 bg-amber-50 rounded mb-1">
                              <span
                                className="text-[9px] font-medium px-1 py-0.5 rounded shrink-0"
                                style={{
                                  backgroundColor: SEVERITY_CONFIG[a.severity]?.bg,
                                  color: SEVERITY_CONFIG[a.severity]?.color,
                                }}
                              >
                                {a.severity}
                              </span>
                              <p className="text-[12px] text-neutral-600">{a.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Growing clusters */}
                      {report?.growingClusters?.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Growing themes</div>
                          {report.growingClusters.slice(0, 5).map((c: { title: string; delta: number }, i: number) => (
                            <p key={i} className="text-[12px] text-neutral-600">
                              &ldquo;{c.title}&rdquo; — +{c.delta} this week
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Merge suggestions */}
                      {report?.mergeSuggestions?.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">Merge suggestions</div>
                          {report.mergeSuggestions.map((m: { titles: [string, string]; similarity: number }, i: number) => (
                            <p key={i} className="text-[12px] text-neutral-600">
                              &ldquo;{m.titles[0]}&rdquo; + &ldquo;{m.titles[1]}&rdquo; — {m.similarity}% similar
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
