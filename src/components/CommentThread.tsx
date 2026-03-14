'use client'

import { useState, useEffect } from 'react'
import { getComments, createComment, deleteComment } from '@/app/actions'
import type { RequestComment } from '@/types'

function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

interface CommentFormProps {
  requestId: string
  parentId?: string
  isAdmin: boolean
  onPosted: (comment: RequestComment) => void
  onCancel?: () => void
  compact?: boolean
}

function CommentForm({ requestId, parentId, isAdmin, onPosted, onCancel, compact }: CommentFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [body, setBody] = useState('')
  const [isTeam, setIsTeam] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!name.trim() || !body.trim() || submitting) return
    setSubmitting(true)
    try {
      const comment = await createComment(requestId, name, role, body, parentId, isTeam)
      onPosted(comment)
      setName('')
      setRole('')
      setBody('')
      setIsTeam(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className={compact ? 'mt-2' : 'mt-4'}>
      <div className={`flex gap-2 ${compact ? 'mb-1.5' : 'mb-2'}`}>
        <input
          className="flex-1 text-[12px] border border-neutral-300 rounded px-2 py-1.5 outline-none focus:border-neutral-500"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="flex-1 text-[12px] border border-neutral-300 rounded px-2 py-1.5 outline-none focus:border-neutral-500"
          placeholder="Your role — e.g. Restaurant partner"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
      <textarea
        className="w-full text-[13px] border border-neutral-300 rounded px-2 py-1.5 outline-none focus:border-neutral-500 resize-none"
        rows={compact ? 2 : 3}
        placeholder="Share context, ask a question, or add evidence..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      <div className="flex items-center justify-between mt-1.5">
        <div>
          {isAdmin && (
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isTeam}
                onChange={(e) => setIsTeam(e.target.checked)}
                className="rounded border-neutral-300"
              />
              Post as product team response
            </label>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onCancel() }} className="text-[11px] text-neutral-400 hover:text-neutral-600">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!name.trim() || !body.trim() || submitting}
            className="text-[11px] font-medium px-3 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </div>
    </form>
  )
}

function SingleComment({
  comment,
  requestId,
  isAdmin,
  isReply,
  onReplyPosted,
  onDeleted,
}: {
  comment: RequestComment
  requestId: string
  isAdmin: boolean
  isReply?: boolean
  onReplyPosted: (parentId: string, reply: RequestComment) => void
  onDeleted: (id: string) => void
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  return (
    <div
      className={`${isReply ? 'ml-6 ' : ''}${comment.is_team_response ? 'border-l-[3px] pl-3' : ''}`}
      style={comment.is_team_response ? { borderLeftColor: 'var(--nt-green)' } : undefined}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[13px] font-medium text-neutral-800">{comment.author_name}</span>
        {comment.author_role && (
          <span className="text-[11px] text-neutral-400">{comment.author_role}</span>
        )}
        {comment.is_team_response && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(80,232,138,0.15)', color: 'var(--nt-green-dark)' }}>
            Product team
          </span>
        )}
        <span className="text-[11px] text-neutral-400">{timeAgo(comment.created_at)}</span>
      </div>
      <p className="text-[13px] text-neutral-600 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
      <div className="flex items-center gap-3 mt-1">
        {!isReply && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowReplyForm(!showReplyForm) }}
            className="text-[11px] text-neutral-400 hover:text-neutral-600"
          >
            Reply
          </button>
        )}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Delete this comment?')) {
                deleteComment(comment.id).then(() => onDeleted(comment.id))
              }
            }}
            className="text-[11px] text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
      {showReplyForm && (
        <CommentForm
          requestId={requestId}
          parentId={comment.id}
          isAdmin={isAdmin}
          compact
          onPosted={(reply) => {
            onReplyPosted(comment.id, reply)
            setShowReplyForm(false)
          }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}
    </div>
  )
}

interface Props {
  requestId: string
  isAdmin: boolean
}

export default function CommentThread({ requestId, isAdmin }: Props) {
  const [comments, setComments] = useState<RequestComment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getComments(requestId)
      .then(setComments)
      .finally(() => setLoading(false))
  }, [requestId])

  function handleTopLevelPosted(comment: RequestComment) {
    setComments((prev) => [...prev, { ...comment, replies: [] }])
  }

  function handleReplyPosted(parentId: string, reply: RequestComment) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), reply] }
          : c
      )
    )
  }

  function handleDeleted(id: string) {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          replies: (c.replies ?? []).filter((r) => r.id !== id),
        }))
    )
  }

  return (
    <div className="border-t border-neutral-100 pt-3 mt-3" onClick={(e) => e.stopPropagation()}>
      <div className="font-medium text-neutral-500 text-[10px] uppercase tracking-wide mb-3">Discussion</div>

      {loading ? (
        <p className="text-[12px] text-neutral-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-[12px] text-neutral-400 italic mb-3">No comments yet. Be the first to add context.</p>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <SingleComment
                comment={comment}
                requestId={requestId}
                isAdmin={isAdmin}
                onReplyPosted={handleReplyPosted}
                onDeleted={handleDeleted}
              />
              {(comment.replies ?? []).map((reply) => (
                <div key={reply.id} className="mt-2">
                  <SingleComment
                    comment={reply}
                    requestId={requestId}
                    isAdmin={isAdmin}
                    isReply
                    onReplyPosted={handleReplyPosted}
                    onDeleted={handleDeleted}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <CommentForm
        requestId={requestId}
        isAdmin={isAdmin}
        onPosted={handleTopLevelPosted}
      />
    </div>
  )
}
