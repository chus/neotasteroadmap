import { getPublicInitiatives } from '../actions'
import PublicBoard from '@/components/PublicBoard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'NeoTaste Product Roadmap',
  description: "See what NeoTaste is building, what's coming next, and what we're exploring.",
}

export default async function PublicPage() {
  const initiatives = await getPublicInitiatives()

  const lastUpdated = initiatives.length > 0
    ? new Date(Math.max(...initiatives.map((i) => new Date(i.created_at).getTime())))
    : null

  return <PublicBoard initiatives={initiatives} lastUpdated={lastUpdated} />
}
