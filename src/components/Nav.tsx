'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Roadmap' },
  { href: '/stats', label: 'Stats' },
  { href: '/shipped', label: 'Shipped' },
  { href: '/comms', label: 'Comms' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/requests', label: 'Feature requests' },
  { href: '/feedback', label: 'Voice' },
]

interface Props {
  unreviewedCount?: number
}

export default function Nav({ unreviewedCount = 0 }: Props) {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-50 w-full h-[52px] flex items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--nt-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Left: logo + product name */}
      <div className="flex items-center gap-2.5">
        {/* Replace with <Image src="/neotaste-icon.png" ... /> when asset is ready */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="rounded-md">
          <rect width="28" height="28" rx="6" fill="var(--nt-green)" />
          <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
        </svg>
        <span className="text-white text-[15px] font-semibold tracking-tight">
          NeoTaste
        </span>
        <span className="text-white/30 text-[13px]">·</span>
        <span className="text-[13px] font-medium" style={{ color: 'var(--nt-green)' }}>
          Product Roadmap
        </span>
      </div>

      {/* Right: nav links + settings gear */}
      <div className="flex items-center gap-5">
        {links.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-[13px] transition-colors pb-0.5"
              style={{
                color: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.7)',
              }}
            >
              {link.label}
              {link.href === '/feedback' && unreviewedCount > 0 && (
                <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                  {unreviewedCount}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: 'var(--nt-green)' }}
                />
              )}
            </Link>
          )
        })}
        <a
          href="/public"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] transition-opacity"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Public view
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <a
          href="/stakeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] transition-opacity"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Stakeholder view
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <Link
          href="/settings"
          className="ml-2 transition-opacity"
          style={{ opacity: pathname === '/settings' ? 1 : 0.7 }}
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {pathname === '/settings' && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
              style={{ backgroundColor: 'var(--nt-green)' }}
            />
          )}
        </Link>
      </div>
    </nav>
  )
}
