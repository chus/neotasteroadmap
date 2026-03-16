'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'
import Footer from './Footer'

export default function LayoutShell({ children, unreviewedCount, isVoiceSubdomain }: { children: React.ReactNode; unreviewedCount?: number; isVoiceSubdomain?: boolean }) {
  const pathname = usePathname()
  const isPublic = pathname === '/public' || pathname === '/stakeholder'

  // Voice subdomain: no nav, no footer — just the content
  if (isVoiceSubdomain || isPublic) {
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
