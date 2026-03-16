'use client'

import { useState } from 'react'
import type { ResearchParticipant, ResearchSession } from '@/types'
import {
  getParticipantWithSessions,
  createResearchSession,
  deleteResearchSession,
  updateParticipant,
  markContacted,
  deleteParticipant,
  addResearchParticipant,
} from '@/app/feedback-actions'

const SESSION_TYPES = [
  { id: 'interview', label: 'Interview' },
  { id: 'survey', label: 'Survey' },
  { id: 'usability_test', label: 'Usability test' },
]

const USER_TYPES = [
  { id: 'consumer', label: 'NeoTaste user' },
  { id: 'restaurant_partner', label: 'Restaurant partner' },
  { id: 'internal', label: 'NeoTaste team' },
]

type ParticipantDetail = {
  participant: ResearchParticipant
  sessions: ResearchSession[]
  submissions: { id: string; title: string; category: string; status: string; created_at: Date }[]
}

export default function ResearchCRM({
  initialParticipants,
}: {
  initialParticipants: ResearchParticipant[]
}) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ParticipantDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [search, setSearch] = useState('')

  // Add participant form
  const [addForm, setAddForm] = useState({ name: '', email: '', user_type: 'consumer' })

  // Session form
  const [sessionForm, setSessionForm] = useState({
    session_type: 'interview',
    topic: '',
    notes: '',
    conducted_by: '',
  })

  async function selectParticipant(id: string) {
    setSelectedId(id)
    setLoadingDetail(true)
    try {
      const data = await getParticipantWithSessions(id)
      setDetail(data as ParticipantDetail | null)
    } catch {
      setDetail(null)
    }
    setLoadingDetail(false)
  }

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name.trim() || !addForm.email.trim()) return
    await addResearchParticipant({
      name: addForm.name,
      email: addForm.email,
      user_type: addForm.user_type,
    })
    setAddForm({ name: '', email: '', user_type: 'consumer' })
    setShowAddForm(false)
    // Refresh (optimistic would be better but keeping simple)
    window.location.reload()
  }

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !sessionForm.topic.trim()) return
    await createResearchSession({
      participant_id: selectedId,
      session_type: sessionForm.session_type,
      topic: sessionForm.topic,
      notes: sessionForm.notes,
      conducted_by: sessionForm.conducted_by || undefined,
      conducted_at: new Date().toISOString(),
    })
    setSessionForm({ session_type: 'interview', topic: '', notes: '', conducted_by: '' })
    setShowSessionForm(false)
    // Refresh detail
    await selectParticipant(selectedId)
  }

  async function handleDeleteSession(sessionId: string) {
    await deleteResearchSession(sessionId)
    if (selectedId) await selectParticipant(selectedId)
  }

  async function handleMarkContacted(id: string) {
    await markContacted(id)
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, contact_count: p.contact_count + 1, last_contacted_at: new Date() } : p
      )
    )
    if (selectedId === id && detail) {
      setDetail({
        ...detail,
        participant: {
          ...detail.participant,
          contact_count: detail.participant.contact_count + 1,
          last_contacted_at: new Date(),
        },
      })
    }
  }

  async function handleUpdateTags(id: string, tags: string) {
    await updateParticipant(id, { tags: JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)) })
    setParticipants((prev) =>
      prev.map((p) => p.id === id ? { ...p, tags: JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)) } : p)
    )
  }

  async function handleDelete(id: string) {
    await deleteParticipant(id)
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
    }
  }

  function timeAgo(date: Date | null): string {
    if (!date) return 'Never'
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const filtered = participants.filter((p) => {
    if (!search) return true
    return p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: Participant list */}
      <div className="w-80 shrink-0 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants..."
            className="flex-1 text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[12px] font-medium px-3 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors shrink-0"
          >
            + Add
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAddParticipant} className="bg-white rounded-lg border border-neutral-200 p-3 space-y-2">
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
            />
            <input
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
            />
            <select
              value={addForm.user_type}
              onChange={(e) => setAddForm((f) => ({ ...f, user_type: e.target.value }))}
              className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
            >
              {USER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-[12px] text-neutral-500 hover:text-neutral-700">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Participant cards */}
        <div className="space-y-1.5">
          {filtered.map((p) => {
            const tags: string[] = (() => { try { return JSON.parse(p.tags) } catch { return [] } })()
            return (
              <button
                key={p.id}
                onClick={() => selectParticipant(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedId === p.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-800 truncate">{p.name}</span>
                  <span className="text-[10px] text-neutral-400">{p.contact_count} contacts</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate">{p.email}</div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">{tag}</span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-[12px] text-neutral-400 text-center py-4">No participants found.</p>
          )}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-1 min-w-0">
        {!selectedId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-neutral-400">Select a participant to view details</p>
          </div>
        )}

        {selectedId && loadingDetail && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-neutral-400">Loading...</p>
          </div>
        )}

        {selectedId && !loadingDetail && detail && (
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5">
            {/* Profile header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-neutral-800">{detail.participant.name}</h2>
                <p className="text-[13px] text-neutral-500">{detail.participant.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {USER_TYPES.find((t) => t.id === detail.participant.user_type)?.label ?? detail.participant.user_type}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    via {detail.participant.source}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkContacted(detail.participant.id)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Mark contacted
                </button>
                <button
                  onClick={() => handleDelete(detail.participant.id)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-[18px] font-semibold text-neutral-800">{detail.participant.contact_count}</div>
                <div className="text-[11px] text-neutral-400">Contacts</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-[18px] font-semibold text-neutral-800">{detail.sessions.length}</div>
                <div className="text-[11px] text-neutral-400">Sessions</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="text-[18px] font-semibold text-neutral-800">{detail.submissions.length}</div>
                <div className="text-[11px] text-neutral-400">Submissions</div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Tags</label>
              <input
                defaultValue={(() => { try { return JSON.parse(detail.participant.tags).join(', ') } catch { return '' } })()}
                onBlur={(e) => handleUpdateTags(detail.participant.id, e.target.value)}
                placeholder="Add tags (comma-separated)"
                className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Notes</label>
              <textarea
                defaultValue={detail.participant.notes}
                onBlur={(e) => updateParticipant(detail.participant.id, { notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
                className="mt-1 w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 resize-none"
              />
            </div>

            {/* Sessions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Research sessions</label>
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="text-[11px] font-medium text-green-700 hover:text-green-800"
                >
                  + Add session
                </button>
              </div>

              {showSessionForm && (
                <form onSubmit={handleAddSession} className="border border-neutral-200 rounded-lg p-3 mb-3 space-y-2">
                  <select
                    value={sessionForm.session_type}
                    onChange={(e) => setSessionForm((f) => ({ ...f, session_type: e.target.value }))}
                    className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm((f) => ({ ...f, topic: e.target.value }))}
                    placeholder="Topic"
                    className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
                  />
                  <input
                    value={sessionForm.conducted_by}
                    onChange={(e) => setSessionForm((f) => ({ ...f, conducted_by: e.target.value }))}
                    placeholder="Conducted by"
                    className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500"
                  />
                  <textarea
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes"
                    rows={2}
                    className="w-full text-[13px] border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-neutral-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors">
                      Save session
                    </button>
                    <button type="button" onClick={() => setShowSessionForm(false)} className="text-[12px] text-neutral-500 hover:text-neutral-700">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {detail.sessions.length === 0 && !showSessionForm && (
                <p className="text-[12px] text-neutral-400 py-2">No sessions yet.</p>
              )}

              <div className="space-y-2">
                {detail.sessions.map((session) => (
                  <div key={session.id} className="border border-neutral-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {SESSION_TYPES.find((t) => t.id === session.session_type)?.label ?? session.session_type}
                          </span>
                          <span className="text-[12px] font-medium text-neutral-800">{session.topic}</span>
                        </div>
                        {session.conducted_by && (
                          <span className="text-[11px] text-neutral-400 mt-0.5 block">by {session.conducted_by}</span>
                        )}
                        {session.notes && (
                          <p className="text-[12px] text-neutral-500 mt-1">{session.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">{timeAgo(session.conducted_at ?? session.created_at)}</span>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-[10px] text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions from this participant */}
            {detail.submissions.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-2 block">
                  Feedback submissions
                </label>
                <div className="space-y-1.5">
                  {detail.submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] text-neutral-800 truncate block">{sub.title}</span>
                        <span className="text-[10px] text-neutral-400">{sub.category}</span>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0 ml-2">
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
