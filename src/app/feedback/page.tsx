import { getFeedbackSubmissions, getClusters, getBacklogCounts } from '@/app/feedback-actions'
import FeedbackInboxWithTabs from '@/components/voice/FeedbackInboxWithTabs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const [submissions, clusters, backlogCounts] = await Promise.all([
    getFeedbackSubmissions(),
    getClusters(),
    getBacklogCounts(),
  ])

  return (
    <main className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">
            Voice — Feedback inbox
          </h1>
          <p className="text-[13px] text-neutral-500">
            Consumer feedback submitted through the Voice portal. AI-triaged automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/feedback/participants"
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-300 transition-colors"
          >
            Participants
          </Link>
          <Link
            href="/voice"
            target="_blank"
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-300 transition-colors inline-flex items-center gap-1"
          >
            Voice form
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </div>

      <FeedbackInboxWithTabs
        initialSubmissions={submissions}
        initialClusters={clusters}
        watchingDueCount={backlogCounts.watchingDueCount}
      />
    </main>
  )
}
