import { getInitiatives } from './actions'
import Board from '@/components/Board'

export default async function Home() {
  const initiatives = await getInitiatives()

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-6">
        2026 product roadmap
      </h1>
      <Board initialData={initiatives} />
    </main>
  )
}
