import { getInitiatives, getStrategicLevels, getFeatureRequests } from '../actions'
import StatsPage from '@/components/StatsPage'

export const dynamic = 'force-dynamic'

export default async function Stats() {
  const [initiatives, levels, requests] = await Promise.all([
    getInitiatives(),
    getStrategicLevels(),
    getFeatureRequests(),
  ])

  return <StatsPage initiatives={initiatives} levels={levels} requests={requests} />
}
