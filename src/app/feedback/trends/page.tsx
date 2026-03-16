import { getFeedbackTrendData } from '@/app/feedback-actions'
import TrendsView from '@/components/voice/TrendsView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  const data = await getFeedbackTrendData()

  return (
    <main className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/feedback" className="text-[13px] text-neutral-400 hover:text-neutral-600">
              Voice
            </Link>
            <span className="text-[13px] text-neutral-300">/</span>
            <span className="text-[13px] text-neutral-600">Trends</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">
            Voice trends
          </h1>
          <p className="text-[13px] text-neutral-500">
            Submission patterns, growing themes, and system health over time.
          </p>
        </div>
      </div>

      <TrendsView data={data} />
    </main>
  )
}
