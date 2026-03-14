import { Suspense } from 'react'
import { getFeatureRequests, getStrategicLevels, getCommentCounts } from '../actions'
import RequestsFeed from '@/components/RequestsFeed'

export default async function RequestsPage() {
  const [requests, levels] = await Promise.all([
    getFeatureRequests(),
    getStrategicLevels(),
  ])
  const commentCounts = await getCommentCounts(requests.map((r) => r.id))

  return (
    <main className="min-h-screen bg-white p-8 max-w-3xl mx-auto">
      <h1 className="text-[20px] font-semibold text-neutral-800 mb-2">
        Feature requests
      </h1>
      <p className="text-[13px] text-neutral-500 mb-6">
        Submit structured requests with customer evidence. The product team reviews every submission.
      </p>
      <Suspense>
        <RequestsFeed initialRequests={requests} strategicLevels={levels} initialCommentCounts={commentCounts} />
      </Suspense>
    </main>
  )
}
