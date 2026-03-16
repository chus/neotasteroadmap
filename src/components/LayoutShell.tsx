'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'
import Footer from './Footer'

export default function LayoutShell({ children, unreviewedCount }: { children: React.ReactNode; unreviewedCount?: number }) {
  const pathname = usePathname()
  const isPublic = pathname === '/public' || pathname === '/stakeholder'

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <>
      <Nav unreviewedCount={unreviewedCount} />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
