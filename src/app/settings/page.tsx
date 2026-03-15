import { getStrategicLevels, getInitiatives, getAllLinearSyncLogs } from '../actions'
import StrategicLevelsManager from '@/components/StrategicLevelsManager'
import LinearSettings from '@/components/LinearSettings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [levels, initiatives, syncLogs] = await Promise.all([
    getStrategicLevels(),
    getInitiatives(),
    getAllLinearSyncLogs(20, 0),
  ])

  // Count initiatives per level
  const levelCounts: Record<string, number> = {}
  for (const init of initiatives) {
    if (init.strategic_level_id) {
      levelCounts[init.strategic_level_id] = (levelCounts[init.strategic_level_id] ?? 0) + 1
    }
  }

  const isLinearConfigured = !!process.env.LINEAR_API_KEY

  return (
    <main className="min-h-screen bg-white p-8 max-w-3xl mx-auto">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-2">Settings</h1>
      <p className="text-[13px] text-neutral-500 mb-8">Manage integrations and strategic levels.</p>

      <LinearSettings
        isConfigured={isLinearConfigured}
        initiatives={initiatives}
        strategicLevels={levels}
        initialSyncLogs={syncLogs}
      />

      <StrategicLevelsManager initialLevels={levels} levelCounts={levelCounts} />
    </main>
  )
}
