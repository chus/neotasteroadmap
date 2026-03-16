'use client'

import { useState, useEffect, useRef } from 'react'
import { COLUMNS, CRITERION_CONFIG } from '@/lib/constants'
import { getLinearProjects, importFromLinear, linkExistingToLinear } from '@/app/actions'
import type { StrategicLevel, Criterion, Column, Initiative } from '@/types'

interface LinearProject {
  id: string
  name: string
  state: string
  url: string
  targetDate: string | null
  description: string | null
}

interface Props {
  strategicLevels: StrategicLevel[]
  initiatives: Initiative[]
  onImported: (initiative: Initiative) => void
  onLinked?: (initiativeId: string) => void
  onClose: () => void
  defaultTab?: 'import' | 'link'
  preSelectedInitiativeId?: string | null
}

const STATE_COLORS: Record<string, string> = {
  started: '#50E88A',
  planned: '#378ADD',
  backlog: '#7F77DD',
  cancelled: '#999',
  completed: '#10b981',
}

const COLUMN_LABELS: Record<string, string> = {
  now: 'Now',
  next: 'Next',
  later: 'Later',
  parked: 'Parked',
  released: 'Released',
}

function similarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().split(/\s+/)
  const wordsB = b.toLowerCase().split(/\s+/)
  const shared = wordsA.filter((w) => wordsB.includes(w))
  return shared.length / Math.max(wordsA.length, wordsB.length)
}

export default function LinearImportModal({ strategicLevels, initiatives, onImported, onLinked, onClose, defaultTab = 'link', preSelectedInitiativeId = null }: Props) {
  const [tab, setTab] = useState<'import' | 'link'>(defaultTab)
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Import tab state
  const [importSearch, setImportSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [column, setColumn] = useState<string>('now')
  const [criterion, setCriterion] = useState<string>('execution_ready')
  const [strategicLevelId, setStrategicLevelId] = useState(strategicLevels[0]?.id ?? '')

  // Link tab state
  const [linkProjectSearch, setLinkProjectSearch] = useState('')
  const [linkInitSearch, setLinkInitSearch] = useState('')
  const [selectedLinkProjectId, setSelectedLinkProjectId] = useState<string | null>(null)
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(preSelectedInitiativeId)
  const [autoMatched, setAutoMatched] = useState(false)
  const [matchScore, setMatchScore] = useState(0)
  const [pullState, setPullState] = useState(true)
  const [pushData, setPushData] = useState(false)
  const [linking, setLinking] = useState(false)

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getLinearProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load Linear projects. Check your API key in settings.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Auto-match when a Linear project is selected in link tab
  useEffect(() => {
    if (!selectedLinkProjectId) return
    const project = projects.find((p) => p.id === selectedLinkProjectId)
    if (!project) return

    let bestMatch: Initiative | null = null
    let bestScore = 0
    for (const init of initiatives) {
      const score = similarity(project.name, init.title)
      if (score > bestScore) {
        bestScore = score
        bestMatch = init
      }
    }

    if (bestScore > 0.4 && bestMatch) {
      setSelectedInitiativeId(bestMatch.id)
      setAutoMatched(true)
      setMatchScore(bestScore)
    } else {
      if (!preSelectedInitiativeId) {
        setSelectedInitiativeId(null)
      }
      setAutoMatched(false)
      setMatchScore(0)
    }
  }, [selectedLinkProjectId, projects, initiatives, preSelectedInitiativeId])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  const filteredProjects = projects.filter((p) => {
    const search = tab === 'import' ? importSearch : linkProjectSearch
    return p.name.toLowerCase().includes(search.toLowerCase())
  })

  const filteredInitiatives = initiatives.filter((i) =>
    i.title.toLowerCase().includes(linkInitSearch.toLowerCase())
  )

  async function handleImport() {
    if (!selectedProjectId || !strategicLevelId) return
    setImporting(true)
    setError(null)
    try {
      const initiative = await importFromLinear(
        selectedProjectId,
        column as Column,
        criterion as Criterion,
        strategicLevelId
      )
      onImported(initiative)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setImporting(false)
    }
  }

  async function handleLink() {
    if (!selectedLinkProjectId || !selectedInitiativeId) return
    setLinking(true)
    setError(null)
    try {
      const result = await linkExistingToLinear(selectedInitiativeId, selectedLinkProjectId, pullState, pushData)
      if (result.success) {
        onLinked?.(selectedInitiativeId)
        onClose()
      } else {
        setError(result.error ?? 'Link failed')
        setLinking(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link failed')
      setLinking(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl my-8 p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: '#5E6AD2' }}>
            L
          </div>
          <h2 className="text-[16px] font-semibold text-neutral-800">Linear</h2>
        </div>
        <p className="text-[12px] text-neutral-500 mb-4">
          Import a new initiative or link an existing one to a Linear project.
        </p>

        {/* Tabs */}
        <div className="inline-flex bg-neutral-100 rounded-lg p-0.5 mb-4">
          <button
            onClick={() => setTab('link')}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{
              backgroundColor: tab === 'link' ? 'var(--nt-dark, #0D2818)' : 'transparent',
              color: tab === 'link' ? 'white' : '#666',
            }}
          >
            Link to existing
          </button>
          <button
            onClick={() => setTab('import')}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{
              backgroundColor: tab === 'import' ? 'var(--nt-dark, #0D2818)' : 'transparent',
              color: tab === 'import' ? 'white' : '#666',
            }}
          >
            Import as new
          </button>
        </div>

        {/* ─── Import tab ─── */}
        {tab === 'import' && (
          <>
            <input
              type="text"
              value={importSearch}
              onChange={(e) => setImportSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 mb-3"
            />

            <div className="border border-neutral-200 rounded-lg max-h-[240px] overflow-y-auto mb-4">
              {loading ? (
                <div className="p-4 text-center text-[12px] text-neutral-400">Loading projects from Linear...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-neutral-400">
                  {projects.length === 0 ? 'No projects found. Check your Linear API key and team configuration.' : 'No matching projects.'}
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const bestMatch = initiatives.reduce<{ title: string; score: number } | null>((best, init) => {
                    const score = similarity(p.name, init.title)
                    if (score > (best?.score ?? 0.4)) return { title: init.title, score }
                    return best
                  }, null)
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id === selectedProjectId ? null : p.id)}
                      className={`w-full text-left px-3 py-2.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors ${
                        selectedProjectId === p.id ? 'bg-[#5E6AD2]/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-neutral-800 truncate">{p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {bestMatch && (
                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={`Similar to: ${bestMatch.title}`}>
                              Possible duplicate
                            </span>
                          )}
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: (STATE_COLORS[p.state] ?? '#999') + '20',
                              color: STATE_COLORS[p.state] ?? '#999',
                            }}
                          >
                            {p.state}
                          </span>
                          {p.targetDate && (
                            <span className="text-[10px] text-neutral-400">{p.targetDate}</span>
                          )}
                        </div>
                      </div>
                      {bestMatch && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Similar to: {bestMatch.title}</p>
                      )}
                      {!bestMatch && p.description && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{p.description}</p>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {selectedProjectId && (
              <div className="space-y-3 mb-4 p-3 bg-neutral-50 rounded-lg">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Column</label>
                    <select
                      className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                      value={column}
                      onChange={(e) => setColumn(e.target.value)}
                    >
                      {COLUMNS.filter((c) => c.id !== 'released').map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Criterion</label>
                    <select
                      className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                      value={criterion}
                      onChange={(e) => setCriterion(e.target.value)}
                    >
                      {(Object.entries(CRITERION_CONFIG) as [string, { label: string }][]).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic level</label>
                  <select
                    className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                    value={strategicLevelId}
                    onChange={(e) => setStrategicLevelId(e.target.value)}
                  >
                    {strategicLevels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedProjectId || importing}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#5E6AD2' }}
              >
                {importing ? 'Importing...' : 'Import as new initiative'}
              </button>
            </div>
          </>
        )}

        {/* ─── Link tab ─── */}
        {tab === 'link' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Left panel — Linear projects */}
              <div>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Linear project</div>
                <input
                  type="text"
                  value={linkProjectSearch}
                  onChange={(e) => setLinkProjectSearch(e.target.value)}
                  placeholder="Search Linear projects..."
                  className="w-full text-[12px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400 mb-2"
                />
                <div className="border border-neutral-200 rounded-lg max-h-[260px] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-[12px] text-neutral-400">Loading...</div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-neutral-400">No projects found.</div>
                  ) : (
                    filteredProjects.map((p) => {
                      const isSelected = selectedLinkProjectId === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedLinkProjectId(isSelected ? null : p.id)}
                          className={`w-full text-left px-3 py-2 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors`}
                          style={{ borderLeft: isSelected ? '3px solid var(--nt-green, #50E88A)' : '3px solid transparent' }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[12px] font-medium text-neutral-800 truncate">{p.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: (STATE_COLORS[p.state] ?? '#999') + '20',
                                  color: STATE_COLORS[p.state] ?? '#999',
                                }}
                              >
                                {p.state}
                              </span>
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          {p.description && (
                            <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{p.description}</p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right panel — Roadmap initiatives */}
              <div>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Roadmap initiative</div>
                <input
                  type="text"
                  value={linkInitSearch}
                  onChange={(e) => setLinkInitSearch(e.target.value)}
                  placeholder="Search roadmap initiatives..."
                  className="w-full text-[12px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400 mb-2"
                />
                <div className="border border-neutral-200 rounded-lg max-h-[260px] overflow-y-auto">
                  {filteredInitiatives.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-neutral-400">No initiatives found.</div>
                  ) : (
                    filteredInitiatives.map((init) => {
                      const isSelected = selectedInitiativeId === init.id
                      const alreadyLinked = !!init.linear_project_id
                      return (
                        <button
                          key={init.id}
                          onClick={() => { setSelectedInitiativeId(isSelected ? null : init.id); setAutoMatched(false) }}
                          className={`w-full text-left px-3 py-2 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors`}
                          style={{ borderLeft: isSelected ? '3px solid var(--nt-green, #50E88A)' : '3px solid transparent' }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[12px] font-medium text-neutral-800 truncate">{init.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {init.strategic_level_color && (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: init.strategic_level_color }}
                                  title={init.strategic_level_name}
                                />
                              )}
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                                {COLUMN_LABELS[init.column] ?? init.column}
                              </span>
                              {alreadyLinked && (
                                <span className="text-[8px] font-medium px-1 py-0.5 rounded bg-amber-100 text-amber-700">
                                  Linked
                                </span>
                              )}
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Auto-match note */}
            {autoMatched && selectedLinkProjectId && selectedInitiativeId && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] text-neutral-400 italic">
                  Auto-matched by title similarity — confirm or change.
                </span>
                {matchScore > 0.7 ? (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">Strong match</span>
                ) : (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Possible match</span>
                )}
              </div>
            )}

            {/* Sync options */}
            {selectedLinkProjectId && selectedInitiativeId && (
              <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">After linking</div>
                <label className="flex items-center gap-2 text-[12px] text-neutral-700 cursor-pointer mb-1.5">
                  <input type="checkbox" checked={pullState} onChange={(e) => setPullState(e.target.checked)} className="rounded" />
                  Pull Linear state → update roadmap column
                </label>
                <label className="flex items-center gap-2 text-[12px] text-neutral-700 cursor-pointer">
                  <input type="checkbox" checked={pushData} onChange={(e) => setPushData(e.target.checked)} className="rounded" />
                  Push roadmap data → update Linear project
                </label>
                <p className="text-[11px] text-neutral-400 mt-2">
                  You can always manually push or pull from the initiative detail panel.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={!selectedLinkProjectId || !selectedInitiativeId || linking}
                className="text-[12px] font-medium px-4 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#5E6AD2' }}
              >
                {linking ? 'Linking...' : 'Link and sync'}
              </button>
            </div>
          </>
        )}

        {/* Error display */}
        {error && (
          <p className="text-[11px] text-red-500 mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
