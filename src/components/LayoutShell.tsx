'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'
import Footer from './Footer'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = pathname === '/public'

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
