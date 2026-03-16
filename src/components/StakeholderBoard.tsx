'use client'

import { useState } from 'react'
import { COLUMNS, PHASE_CONFIG, MONTH_SHORT } from '@/lib/constants'
import type { Initiative, StrategicLevel } from '@/types'

interface Props {
  initiatives: Initiative[]
  levels: StrategicLevel[]
  lastUpdated: Date
}

export default function StakeholderBoard({ initiatives, levels, lastUpdated }: Props) {
  const [showReleased, setShowReleased] = useState(false)
  const [copied, setCopied] = useState(false)

  const parents = initiatives.filter((i) => i.is_parent)
  const activeColumns = COLUMNS.filter((c) => c.id !== 'parked')
  const releasedItems = initiatives.filter((i) => i.column === 'parked' && i.criterion === 'parked')

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--nt-dark)' }} className="px-6 py-8 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="rounded-md">
                <rect width="28" height="28" rx="6" fill="var(--nt-green)" />
                <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
              </svg>
              <span className="text-white text-[15px] font-semibold tracking-tight">NeoTaste</span>
            </div>
            <h1 className="text-white text-[20px] font-medium">2026 Product Strategy</h1>
            <p className="text-white/60 text-[13px] mt-1">A strategic overview of what we&apos;re building and why.</p>
            <p className="text-white/40 text-[11px] mt-2">
              Updated {lastUpdated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors mt-1"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8">
        {/* Strategic bets */}
        {parents.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[14px] font-medium text-neutral-400 mb-4">Strategic bets</h2>
            <div className="space-y-3">
              {parents.map((parent) => {
                const children = initiatives.filter((i) => i.parent_initiative_id === parent.id)
                const phaseConfig = parent.phase ? PHASE_CONFIG[parent.phase] : null
                return (
                  <div
                    key={parent.id}
                    className="rounded-lg p-4"
                    style={{
                      border: `1px solid ${parent.parent_color ?? '#5E6AD2'}30`,
                      borderLeft: `4px solid ${parent.parent_color ?? '#5E6AD2'}`,
                      background: `${parent.parent_color ?? '#5E6AD2'}08`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px] font-semibold text-neutral-800">{parent.title}</span>
                      {phaseConfig && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: phaseConfig.color + '1a', color: phaseConfig.color }}
                        >
                          {phaseConfig.label}
                        </span>
                      )}
                    </div>
                    {parent.subtitle && (
                      <p className="text-[13px] text-neutral-500 leading-relaxed">{parent.subtitle}</p>
                    )}
                    <p className="text-[11px] text-neutral-400 mt-2">
                      {children.length} linked initiative{children.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Roadmap overview */}
        <section className="mb-10">
          <h2 className="text-[14px] font-medium text-neutral-400 mb-4">What we&apos;re working on</h2>
          <div className="grid grid-cols-3 gap-4">
            {activeColumns.map((col) => {
              const colItems = initiatives
                .filter((i) => i.column === col.id && !i.is_parent)
                .sort((a, b) => a.position - b.position)
              return (
                <div key={col.id}>
                  <div className="mb-3">
                    <span className="text-[11px] uppercase tracking-wider font-medium text-neutral-500">{col.label}</span>
                    <span className="text-[10px] text-neutral-400 ml-1.5">{col.sublabel}</span>
                    <span className="text-[11px] font-medium text-neutral-400 ml-2">{colItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg p-3 border border-neutral-200"
                        style={{ borderLeft: `3px solid ${item.strategic_level_color}` }}
                      >
                        {item.strategic_level_name && (
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">
                            {item.strategic_level_name}
                          </div>
                        )}
                        <div className="text-[13px] font-medium text-neutral-800 leading-snug">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <p className="text-[12px] text-neutral-400 italic mt-1 line-clamp-2">{item.subtitle}</p>
                        )}
                        {item.target_month && MONTH_SHORT[item.target_month] && (
                          <span className="inline-block text-[10px] font-medium text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5 mt-1.5">
                            {MONTH_SHORT[item.target_month]}
                          </span>
                        )}
                      </div>
                    ))}
                    {colItems.length === 0 && (
                      <p className="text-[11px] text-neutral-300 italic">No initiatives</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Released */}
        {releasedItems.length > 0 && (
          <section className="mb-10">
            <button
              onClick={() => setShowReleased(!showReleased)}
              className="text-[13px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showReleased ? 'rotate-90' : ''}`}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Show released ({releasedItems.length})
            </button>
            {showReleased && (
              <div className="mt-3 space-y-1.5">
                {releasedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-green-600">&#10003;</span>
                    <span className="text-neutral-700">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-neutral-400 italic truncate max-w-[300px]">{item.subtitle}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Strategic level summary */}
        {levels.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[14px] font-medium text-neutral-400 mb-4">Where we&apos;re focused</h2>
            <div className="space-y-3">
              {levels.map((level) => {
                const activeCount = initiatives.filter(
                  (i) => i.strategic_level_id === level.id && (i.column === 'now' || i.column === 'next')
                ).length
                const totalActive = initiatives.filter(
                  (i) => i.column === 'now' || i.column === 'next'
                ).length
                const pct = totalActive > 0 ? (activeCount / totalActive) * 100 : 0
                return (
                  <div key={level.id} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: level.color }} />
                    <span className="text-[13px] font-medium text-neutral-700 w-28 shrink-0">{level.name}</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: level.color }}
                      />
                    </div>
                    <span className="text-[11px] text-neutral-400 shrink-0 w-28 text-right">
                      {activeCount} active initiative{activeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-neutral-200 pt-6 pb-8 flex items-center justify-between text-[12px] text-neutral-400">
          <div className="flex items-center gap-4">
            <a href="/requests" className="hover:text-neutral-600">Want to suggest a feature?</a>
            <a href="/public" className="hover:text-neutral-600">See what&apos;s shipped &rarr;</a>
          </div>
          <span>Made by Agus</span>
        </footer>
      </div>
    </div>
  )
}
