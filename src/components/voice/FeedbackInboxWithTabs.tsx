'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FeedbackInbox from './FeedbackInbox'
import ClusterView from './ClusterView'
import type { FeedbackSubmission, FeedbackCluster } from '@/types'

interface Props {
  initialSubmissions: FeedbackSubmission[]
  initialClusters: FeedbackCluster[]
  watchingDueCount?: number
}

export default function FeedbackInboxWithTabs({ initialSubmissions, initialClusters, watchingDueCount = 0 }: Props) {
  const [tab, setTab] = useState<'inbox' | 'clusters'>('inbox')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
        <button
          onClick={() => setTab('inbox')}
          className={`text-[13px] font-medium px-3 py-2 border-b-2 transition-colors ${
            tab === 'inbox'
              ? 'border-neutral-800 text-neutral-800'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          Inbox
          <span className="ml-1.5 text-[11px] text-neutral-400">{initialSubmissions.length}</span>
        </button>
        <button
          onClick={() => setTab('clusters')}
          className={`text-[13px] font-medium px-3 py-2 border-b-2 transition-colors ${
            tab === 'clusters'
              ? 'border-neutral-800 text-neutral-800'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          Clusters
          <span className="ml-1.5 text-[11px] text-neutral-400">{initialClusters.length}</span>
        </button>
        <Link
          href="/feedback/backlog"
          className="text-[13px] font-medium px-3 py-2 border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Backlog
          {watchingDueCount > 0 && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-400 inline-block" />
          )}
        </Link>
        <Link
          href="/feedback/trends"
          className="text-[13px] font-medium px-3 py-2 border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Trends
        </Link>
        <Link
          href="/feedback/agent"
          className="text-[11px] font-medium px-3 py-2 border-b-2 border-transparent text-neutral-300 hover:text-neutral-500 transition-colors ml-auto"
        >
          Agent history
        </Link>
      </div>

      {tab === 'inbox' ? (
        <FeedbackInbox initialSubmissions={initialSubmissions} />
      ) : (
        <ClusterView initialClusters={initialClusters} />
      )}
    </div>
  )
}
