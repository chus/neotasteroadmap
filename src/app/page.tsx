import { getInitiatives, getStrategicLevels, getKeyAccounts, getAllKeyAccountLinks, getReactionsForInitiatives } from './actions'
import Board from '@/components/Board'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [initiatives, levels, keyAccounts, keyAccountLinks] = await Promise.all([
    getInitiatives(),
    getStrategicLevels(),
    getKeyAccounts(),
    getAllKeyAccountLinks(),
  ])

  const reactionMap = await getReactionsForInitiatives(initiatives.map((i) => i.id))

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-6">
        2026 product roadmap
      </h1>
      <Board
        initialData={initiatives}
        initialLevels={levels}
        initialKeyAccounts={keyAccounts}
        initialKeyAccountLinks={keyAccountLinks}
        initialReactions={reactionMap}
      />
    </main>
  )
}
