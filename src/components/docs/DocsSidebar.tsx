'use client'

import { useState, useEffect } from 'react'

const GROUPS = [
  {
    label: 'Roadmap',
    sections: [
      { id: 'the-board', label: 'The board' },
      { id: 'columns', label: 'Columns' },
      { id: 'criteria', label: 'Sequencing criteria' },
      { id: 'strategic-bets', label: 'Strategic bets' },
      { id: 'key-accounts', label: 'Key accounts' },
      { id: 'initiative-detail', label: 'Initiative detail' },
      { id: 'linear-sync', label: 'Linear sync' },
      { id: 'views', label: 'Views' },
      { id: 'stats', label: 'Stats' },
      { id: 'shipped', label: 'What we shipped' },
      { id: 'comms', label: 'Monthly comms' },
      { id: 'feature-requests', label: 'Feature requests' },
      { id: 'what-moves-things', label: 'What moves things' },
    ],
  },
  {
    label: 'Voice',
    sections: [
      { id: 'voice-context', label: 'Context and motivation' },
      { id: 'voice-goals', label: 'What we are trying to achieve' },
      { id: 'voice-how', label: 'How Voice works' },
      { id: 'voice-ux', label: 'What users experience' },
      { id: 'voice-risks', label: 'Risks' },
      { id: 'voice-phases', label: 'Build phases' },
      { id: 'voice-success', label: 'Success metrics' },
      { id: 'voice-where', label: 'Where to find things' },
      { id: 'voice-principles', label: 'Principles' },
    ],
  },
  {
    label: 'Meta',
    sections: [
      { id: 'tool-changelog', label: 'Tool changelog' },
      { id: 'docs-changelog', label: 'Docs changelog' },
    ],
  },
]

const ALL_SECTIONS = GROUPS.flatMap((g) => g.sections)

export default function DocsSidebar({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState(ALL_SECTIONS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    const headings = ALL_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    headings.forEach((el) => observer.observe(el!))

    return () => observer.disconnect()
  }, [])

  function handleClick(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex gap-12 max-w-[1000px] mx-auto">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:block w-[220px] shrink-0">
        <div className="sticky top-[80px]">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <nav className="space-y-0.5">
                {group.sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleClick(s.id)}
                    className="block w-full text-left text-[12px] py-1 transition-colors"
                    style={{
                      color: activeId === s.id ? 'var(--nt-green)' : '#888',
                      fontWeight: activeId === s.id ? 500 : 400,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
