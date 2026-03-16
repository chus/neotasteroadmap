'use client'

import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'context', label: 'Context' },
  { id: 'goals', label: 'Goals' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'user-experience', label: 'User experience' },
  { id: 'risks', label: 'Risks' },
  { id: 'phases', label: 'Build phases' },
  { id: 'success', label: 'Success metrics' },
  { id: 'where', label: 'Where to find things' },
  { id: 'principles', label: 'Principles' },
]

export default function DocsSidebar({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState('context')

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

    const headings = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
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
      <aside className="hidden lg:block w-[200px] shrink-0">
        <div className="sticky top-[80px]">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            On this page
          </p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleClick(s.id)}
                className="block w-full text-left text-[13px] py-1 transition-colors"
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
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
