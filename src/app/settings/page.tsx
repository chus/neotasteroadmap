import { getStrategicLevels, getInitiatives } from '../actions'
import StrategicLevelsManager from '@/components/StrategicLevelsManager'

export default async function SettingsPage() {
  const [levels, initiatives] = await Promise.all([
    getStrategicLevels(),
    getInitiatives(),
  ])

  // Count initiatives per level
  const levelCounts: Record<string, number> = {}
  for (const init of initiatives) {
    if (init.strategic_level_id) {
      levelCounts[init.strategic_level_id] = (levelCounts[init.strategic_level_id] ?? 0) + 1
    }
  }

  return (
    <main className="min-h-screen bg-white p-8 max-w-3xl mx-auto">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-2">Settings</h1>
      <p className="text-[13px] text-neutral-500 mb-8">Manage strategic levels used across the roadmap.</p>

      <StrategicLevelsManager initialLevels={levels} levelCounts={levelCounts} />
    </main>
  )
}
