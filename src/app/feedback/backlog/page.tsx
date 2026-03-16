import { getProblemBacklog, getBacklogCounts, getStrategicLevelsForSelect } from '@/app/feedback-actions'
import BacklogView from '@/components/voice/BacklogView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BacklogPage() {
  const [items, counts, strategicLevels] = await Promise.all([
    getProblemBacklog(),
    getBacklogCounts(),
    getStrategicLevelsForSelect(),
  ])

  return (
    <main className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/feedback" className="text-[13px] text-neutral-400 hover:text-neutral-600">
              Voice
            </Link>
            <span className="text-[13px] text-neutral-300">/</span>
            <span className="text-[13px] text-neutral-600">Backlog</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">
            Problem backlog
          </h1>
          <p className="text-[13px] text-neutral-500">
            Validated problems worth tracking. Not yet on the roadmap — and that&apos;s fine.
          </p>
        </div>
      </div>

      <BacklogView
        initialItems={items}
        counts={counts}
        strategicLevels={strategicLevels}
      />
    </main>
  )
}
