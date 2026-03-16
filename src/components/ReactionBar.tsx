'use client'

import { useState, useCallback } from 'react'
import { toggleReaction } from '@/app/actions'
import type { ReactionCount } from '@/types'

interface Props {
  initiativeId: string
  initialReactions: ReactionCount[]
  compact?: boolean // When true, only show emojis with count > 0
}

export default function ReactionBar({ initiativeId, initialReactions, compact = false }: Props) {
  const [reactions, setReactions] = useState<ReactionCount[]>(initialReactions)
  const [pending, setPending] = useState<string | null>(null)

  const handleClick = useCallback(async (emoji: string) => {
    if (pending) return
    setPending(emoji)

    // Optimistic update
    const prev = reactions
    setReactions((r) =>
      r.map((rc) =>
        rc.emoji === emoji
          ? { ...rc, count: rc.reacted ? rc.count - 1 : rc.count + 1, reacted: !rc.reacted }
          : rc
      )
    )

    // Store in localStorage
    const key = `reaction:${initiativeId}:${emoji}`
    const wasReacted = prev.find((r) => r.emoji === emoji)?.reacted
    localStorage.setItem(key, wasReacted ? '' : '1')

    try {
      const updated = await toggleReaction(initiativeId, emoji)
      setReactions(updated)
    } catch {
      setReactions(prev) // Revert on error
    } finally {
      setPending(null)
    }
  }, [initiativeId, pending, reactions])

  const visibleReactions = compact
    ? reactions.filter((r) => r.count > 0)
    : reactions

  if (compact && visibleReactions.length === 0) return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleReactions.map((r) => (
        <button
          key={r.emoji}
          onClick={(e) => { e.stopPropagation(); handleClick(r.emoji) }}
          disabled={pending === r.emoji}
          className="inline-flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer disabled:opacity-60"
          style={{
            height: 26,
            borderRadius: 13,
            padding: '0 8px',
            background: r.reacted ? '#f5f5f5' : 'transparent',
            border: r.reacted ? '1px solid #d4d4d4' : '0.5px solid #e5e5e5',
            opacity: r.count > 0 || r.reacted ? 1 : 0.4,
          }}
          title={r.emoji}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{r.emoji}</span>
          {r.count > 0 && (
            <span className="text-[11px] text-neutral-500 font-medium">{r.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
