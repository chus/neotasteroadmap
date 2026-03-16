import { getInitiatives, getStrategicLevels } from '../actions'
import StakeholderBoard from '@/components/StakeholderBoard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'NeoTaste — 2026 Product Strategy',
  description: 'A high-level view of the NeoTaste product roadmap for 2026.',
}

export default async function StakeholderPage() {
  const [initiatives, levels] = await Promise.all([
    getInitiatives(),
    getStrategicLevels(),
  ])

  const mostRecent = initiatives.reduce((latest, i) => {
    return i.created_at > latest ? i.created_at : latest
  }, new Date(0))

  return (
    <StakeholderBoard
      initiatives={initiatives}
      levels={levels}
      lastUpdated={mostRecent}
    />
  )
}
