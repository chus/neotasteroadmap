import { getInitiatives, getStrategicLevels, getFeatureRequests } from '../actions'
import { getFeedbackTrendData } from '@/app/feedback-actions'
import StatsPage from '@/components/StatsPage'
import VoiceStatsSection from '@/components/voice/VoiceStatsSection'

export const dynamic = 'force-dynamic'

export default async function Stats() {
  const [initiatives, levels, requests, voiceData] = await Promise.all([
    getInitiatives(),
    getStrategicLevels(),
    getFeatureRequests(),
    getFeedbackTrendData(),
  ])

  return (
    <>
      <StatsPage initiatives={initiatives} levels={levels} requests={requests} />
      <VoiceStatsSection health={voiceData.health} clusterVelocity={voiceData.clusterVelocity} />
    </>
  )
}
