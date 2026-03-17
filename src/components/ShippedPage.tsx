'use client'

import { useState } from 'react'

interface ShippedInitiative {
  id: string
  title: string
  subtitle: string | null
  strategic_level_name: string | null
  strategic_level_color: string | null
  released_at: Date | null
  release_note: string | null
  impact_metric: string | null
  impact_measured_at: Date | null
  shipped_by: string | null
  is_public: boolean
}

interface MonthGroup {
  month: string
  monthKey: string
  initiatives: ShippedInitiative[]
}

interface Props {
  groups: MonthGroup[]
}

export default function ShippedPage({ groups }: Props) {
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [impactOnly, setImpactOnly] = useState(false)

  const allInitiatives = groups.flatMap((g) => g.initiatives)
  const totalShipped = allInitiatives.length
  const withImpact = allInitiatives.filter((i) => i.impact_metric).length

  // Unique strategic areas
  const areas = Array.from(
    new Map(
      allInitiatives
        .filter((i) => i.strategic_level_name)
        .map((i) => [i.strategic_level_name!, { name: i.strategic_level_name!, color: i.strategic_level_color! }])
    ).values()
  )

  // Filter
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      initiatives: g.initiatives.filter((i) => {
        if (areaFilter && i.strategic_level_name !== areaFilter) return false
        if (impactOnly && !i.impact_metric) return false
        return true
      }),
    }))
    .filter((g) => g.initiatives.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#0D2818' }}>
        <h1 className="text-[22px] font-bold text-white mb-1">Shipped</h1>
        <p className="text-[13px] text-green-200/70 mb-4">Everything we&apos;ve delivered</p>
        <div className="flex gap-6">
          <div>
            <div className="text-[24px] font-bold text-white">{totalShipped}</div>
            <div className="text-[11px] text-green-200/60">Initiatives shipped</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white">{groups.length}</div>
            <div className="text-[11px] text-green-200/60">Months</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white">{withImpact}</div>
            <div className="text-[11px] text-green-200/60">With impact data</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <button
          onClick={() => setAreaFilter(null)}
          className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
            !areaFilter
              ? 'border-neutral-500 bg-neutral-100 text-neutral-800'
              : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
          }`}
        >
          All
        </button>
        {areas.map((a) => (
          <button
            key={a.name}
            onClick={() => setAreaFilter(areaFilter === a.name ? null : a.name)}
            className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
              areaFilter === a.name
                ? 'border-neutral-500 bg-neutral-100 text-neutral-800'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5 -mt-0.5 align-middle" style={{ backgroundColor: a.color }} />
            {a.name}
          </button>
        ))}
        <div className="ml-auto">
          <label className="flex items-center gap-1.5 text-[12px] text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={impactOnly}
              onChange={(e) => setImpactOnly(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Impact only
          </label>
        </div>
      </div>

      {/* Month groups */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-[13px] text-neutral-400">
          No shipped initiatives found.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.monthKey}>
              <h2 className="text-[13px] font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                {group.month}
                <span className="text-[11px] font-normal text-neutral-400">{group.initiatives.length}</span>
              </h2>
              <div className="space-y-3">
                {group.initiatives.map((init) => (
                  <div
                    key={init.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {init.strategic_level_color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: init.strategic_level_color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-[14px] font-medium text-neutral-800">{init.title}</h3>
                          {init.released_at && (
                            <span className="text-[11px] text-neutral-400 shrink-0">
                              {new Date(init.released_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {init.release_note && (
                          <p className="text-[13px] text-neutral-600 mt-1">{init.release_note}</p>
                        )}
                        {init.shipped_by && (
                          <p className="text-[11px] text-neutral-400 mt-1">Shipped by {init.shipped_by}</p>
                        )}
                      </div>
                    </div>
                    {init.impact_metric && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="text-[11px] font-medium text-green-700 uppercase tracking-wide mb-0.5">Impact</div>
                        <div className="text-[13px] text-green-800">{init.impact_metric}</div>
                        {init.impact_measured_at && (
                          <div className="text-[11px] text-green-600 mt-0.5">
                            Measured {new Date(init.impact_measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
