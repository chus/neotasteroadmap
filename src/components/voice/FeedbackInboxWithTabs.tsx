'use client'

import { useState } from 'react'
import FeedbackInbox from './FeedbackInbox'
import ClusterView from './ClusterView'
import type { FeedbackSubmission, FeedbackCluster } from '@/types'

interface Props {
  initialSubmissions: FeedbackSubmission[]
  initialClusters: FeedbackCluster[]
}

export default function FeedbackInboxWithTabs({ initialSubmissions, initialClusters }: Props) {
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
      </div>

      {tab === 'inbox' ? (
        <FeedbackInbox initialSubmissions={initialSubmissions} />
      ) : (
        <ClusterView initialClusters={initialClusters} />
      )}
    </div>
  )
}
