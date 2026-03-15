'use client'

import { useState, useMemo } from 'react'
import { COLUMNS, CRITERION_CONFIG, EFFORT_CONFIG, MONTH_SHORT, MONTHS_2026 } from '@/lib/constants'
import { generateCSV, downloadCSV } from '@/lib/csv'
import type { Initiative, StrategicLevel, Column, Criterion } from '@/types'

interface Props {
  initiatives: Initiative[]
  levels: StrategicLevel[]
  activeFilterLevelId: string | null
  searchQuery: string
  onCardClick: (initiative: Initiative) => void
  onDelete: (id: string) => void
}

type SortKey = 'title' | 'column' | 'strategic_level' | 'criterion' | 'effort' | 'target_month' | 'created_at'
type SortDir = 'asc' | 'desc'

const COLUMN_ORDER: Record<string, number> = { now: 0, next: 1, later: 2, parked: 3 }
const EFFORT_ORDER: Record<string, number> = { xs: 0, s: 1, m: 2, l: 3, xl: 4 }

export default function ListView({ initiatives, levels, activeFilterLevelId, searchQuery, onCardClick, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('column')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return initiatives.filter((i) => {
      const matchesFilter = !activeFilterLevelId || i.strategic_level_id === activeFilterLevelId
      const matchesSearch = !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [initiatives, activeFilterLevelId, searchQuery])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'column':
          cmp = (COLUMN_ORDER[a.column] ?? 99) - (COLUMN_ORDER[b.column] ?? 99)
          break
        case 'strategic_level':
          cmp = (a.strategic_level_name || 'zzz').localeCompare(b.strategic_level_name || 'zzz')
          break
        case 'criterion':
          cmp = a.criterion.localeCompare(b.criterion)
          break
        case 'effort':
          cmp = (EFFORT_ORDER[a.effort ?? ''] ?? 99) - (EFFORT_ORDER[b.effort ?? ''] ?? 99)
          break
        case 'target_month':
          cmp = (a.target_month ?? 'zzz').localeCompare(b.target_month ?? 'zzz')
          break
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((i) => i.id)))
    }
  }

  function handleExport() {
    const toExport = selected.size > 0
      ? sorted.filter((i) => selected.has(i.id))
      : sorted
    const csv = generateCSV(toExport)
    downloadCSV(csv, `roadmap-export-${new Date().toISOString().split('T')[0]}.csv`)
  }

  function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} initiative${selected.size === 1 ? '' : 's'}?`)) return
    selected.forEach((id) => onDelete(id))
    setSelected(new Set())
  }

  function SortHeader({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) {
    const isActive = sortKey === sortKeyName
    return (
      <th
        className={`py-2 px-2 text-left font-medium cursor-pointer select-none hover:text-neutral-600 ${className ?? ''}`}
        onClick={() => toggleSort(sortKeyName)}
      >
        <span className={isActive ? 'text-neutral-700' : ''}>
          {label}
        </span>
        {isActive && (
          <span className="ml-0.5 text-[8px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </th>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <>
              <span className="text-[12px] text-neutral-500">{selected.size} selected</span>
              <button
                onClick={handleBulkDelete}
                className="text-[11px] font-medium text-red-500 hover:text-red-700"
              >
                Delete selected
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleExport}
          className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV{selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200 bg-neutral-50">
              <th className="py-2 px-2 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === sorted.length && sorted.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-300"
                />
              </th>
              <SortHeader label="Title" sortKeyName="title" className="min-w-[200px]" />
              <SortHeader label="Column" sortKeyName="column" />
              <SortHeader label="Level" sortKeyName="strategic_level" />
              <SortHeader label="Criterion" sortKeyName="criterion" />
              <SortHeader label="Effort" sortKeyName="effort" />
              <SortHeader label="Month" sortKeyName="target_month" />
              <SortHeader label="Created" sortKeyName="created_at" />
              <th className="py-2 px-2 text-left font-medium">Public</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const config = CRITERION_CONFIG[item.criterion]
              return (
                <tr
                  key={item.id}
                  className={`border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer ${selected.has(item.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-neutral-300"
                    />
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: config.border }} />
                      <div>
                        <p className="text-[13px] font-medium text-neutral-800">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-neutral-400 truncate max-w-[250px]">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {COLUMNS.find((c) => c.id === item.column)?.label ?? item.column}
                    </span>
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    {item.strategic_level_name ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.strategic_level_color }} />
                        <span className="text-[11px] text-neutral-600">{item.strategic_level_name}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: config.badge, color: config.color }}
                    >
                      {config.label}
                    </span>
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    {item.effort && EFFORT_CONFIG[item.effort] ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: EFFORT_CONFIG[item.effort].color + '1a',
                          color: EFFORT_CONFIG[item.effort].color,
                        }}
                      >
                        {EFFORT_CONFIG[item.effort].label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    {item.target_month && MONTH_SHORT[item.target_month] ? (
                      <span className="text-[11px] text-neutral-600">{MONTH_SHORT[item.target_month]}</span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-[11px] text-neutral-400" onClick={() => onCardClick(item)}>
                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2 px-2" onClick={() => onCardClick(item)}>
                    {item.is_public ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#50E88A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[13px] text-neutral-400">
                  No initiatives match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-neutral-400">
        {sorted.length} initiative{sorted.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}
