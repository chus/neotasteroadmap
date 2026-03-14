'use client'

import { COLUMNS, CRITERION_CONFIG, EFFORT_CONFIG } from '@/lib/constants'
import type { Initiative, Criterion } from '@/types'

interface Props {
  initiatives: Initiative[]
  lastUpdated: Date | null
}

function PublicCard({ initiative }: { initiative: Initiative }) {
  const config = CRITERION_CONFIG[initiative.criterion]

  return (
    <div className="relative rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.border }} />
      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-tight text-neutral-800">
            {initiative.title}
          </span>
          {initiative.strategic_level_name && (
            <span
              className="shrink-0 text-[9px] font-medium rounded-full px-1.5 py-0.5 mt-0.5 border"
              style={{
                color: initiative.strategic_level_color,
                borderColor: initiative.strategic_level_color + '40',
              }}
            >
              {initiative.strategic_level_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: config.badge, color: config.color }}
          >
            {config.label}
          </span>
          {initiative.effort && EFFORT_CONFIG[initiative.effort] && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: EFFORT_CONFIG[initiative.effort].color + '1a',
                color: EFFORT_CONFIG[initiative.effort].color,
              }}
            >
              {EFFORT_CONFIG[initiative.effort].label}
            </span>
          )}
        </div>

        {initiative.dep_note && (
          <p className="text-[11px] italic text-neutral-400 mt-1">
            <span className="not-italic">&rarr;</span> {initiative.dep_note}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PublicBoard({ initiatives, lastUpdated }: Props) {
  const publicColumns = COLUMNS.filter((c) => c.id !== 'parked')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="pt-10 pb-8 px-6 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="rounded-md">
            <rect width="28" height="28" rx="6" fill="var(--nt-green)" />
            <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
          </svg>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--nt-dark)' }}>
            NeoTaste
          </span>
        </div>
        <h1 className="text-[24px] font-semibold text-neutral-800 mb-2">Product roadmap</h1>
        <p className="text-[14px] text-neutral-500 max-w-lg mx-auto">
          Here&apos;s what we&apos;re working on and what&apos;s coming next. Updated as priorities shift.
        </p>
        {lastUpdated && (
          <p className="text-[12px] text-neutral-400 mt-2">
            Last updated: {lastUpdated.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </header>

      {/* Board */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-3 gap-4">
          {publicColumns.map((col) => {
            const colItems = initiatives.filter((i) => i.column === col.id)
            return (
              <div key={col.id}>
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-[14px] font-semibold text-neutral-800">{col.label}</h2>
                  <span className="text-[12px] text-neutral-400">{col.sublabel}</span>
                  <span className="text-[11px] text-neutral-400 ml-auto">{colItems.length}</span>
                </div>
                <div className="space-y-2">
                  {colItems.length > 0 ? (
                    colItems.map((initiative) => (
                      <PublicCard key={initiative.id} initiative={initiative} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-[12px] text-neutral-400">
                      Nothing here yet
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-6 py-6" style={{ backgroundColor: 'var(--nt-dark)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Want to suggest a feature?
            </span>
            <a
              href="/requests"
              className="text-[12px] font-medium px-3 py-1 rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
            >
              Submit a request
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              &copy; 2026 NeoTaste
            </span>
            <a
              href="https://www.linkedin.com/in/agustintonna/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] hover:underline"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Made by Agus
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
