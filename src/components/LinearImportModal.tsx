'use client'

import { useState, useEffect, useRef } from 'react'
import { COLUMNS, CRITERION_CONFIG } from '@/lib/constants'
import { getLinearProjects, importFromLinear } from '@/app/actions'
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
  onImported: (initiative: Initiative) => void
  onClose: () => void
}

const STATE_COLORS: Record<string, string> = {
  started: '#50E88A',
  planned: '#378ADD',
  backlog: '#7F77DD',
  cancelled: '#999',
  completed: '#10b981',
}

export default function LinearImportModal({ strategicLevels, onImported, onClose }: Props) {
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [column, setColumn] = useState<string>('now')
  const [criterion, setCriterion] = useState<string>('execution_ready')
  const [strategicLevelId, setStrategicLevelId] = useState(strategicLevels[0]?.id ?? '')

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getLinearProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load Linear projects'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleImport() {
    if (!selectedId || !strategicLevelId) return
    setImporting(true)
    setError(null)
    try {
      const initiative = await importFromLinear(
        selectedId,
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

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-lg my-8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: '#5E6AD2' }}>
            L
          </div>
          <h2 className="text-[16px] font-semibold text-neutral-800">Import from Linear</h2>
        </div>
        <p className="text-[12px] text-neutral-500 mb-4">
          Select a Linear project to import as a new initiative.
        </p>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 mb-3"
        />

        {/* Project list */}
        <div className="border border-neutral-200 rounded-lg max-h-[240px] overflow-y-auto mb-4">
          {loading ? (
            <div className="p-4 text-center text-[12px] text-neutral-400">Loading projects from Linear…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-neutral-400">
              {projects.length === 0 ? 'No projects found. Check your Linear API key and team configuration.' : 'No matching projects.'}
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors ${
                  selectedId === p.id ? 'bg-[#5E6AD2]/5' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-neutral-800 truncate">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
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
                {p.description && (
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{p.description}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Import options */}
        {selectedId && (
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

        {error && (
          <p className="text-[11px] text-red-500 mb-3">{error}</p>
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
            disabled={!selectedId || importing}
            className="text-[12px] font-medium px-4 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#5E6AD2' }}
          >
            {importing ? 'Importing…' : 'Import as new initiative'}
          </button>
        </div>
      </div>
    </div>
  )
}
