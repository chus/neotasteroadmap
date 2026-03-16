'use client'

import { useState } from 'react'
import {
  addResearchParticipant,
  updateParticipant,
  deleteParticipant,
  markContacted,
} from '@/app/feedback-actions'
import type { ResearchParticipant } from '@/types'

interface Props {
  initialParticipants: ResearchParticipant[]
}

export default function ParticipantsList({ initialParticipants }: Props) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', user_type: 'consumer' })
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  const filtered = search
    ? participants.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      )
    : participants

  function formatDate(date: Date | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.email.trim()) return
    try {
      await addResearchParticipant(addForm)
      // Optimistic: add to list
      const newParticipant: ResearchParticipant = {
        id: crypto.randomUUID(),
        name: addForm.name,
        email: addForm.email,
        user_type: addForm.user_type as ResearchParticipant['user_type'],
        source: 'manual',
        tags: '[]',
        notes: '',
        last_contacted_at: null,
        contact_count: 0,
        opted_in_at: new Date(),
        created_at: new Date(),
      }
      setParticipants([newParticipant, ...participants])
      setAddForm({ name: '', email: '', user_type: 'consumer' })
      setShowAdd(false)
    } catch {
      // Handle silently
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this participant?')) return
    await deleteParticipant(id)
    setParticipants(participants.filter((p) => p.id !== id))
  }

  async function handleMarkContacted(id: string) {
    await markContacted(id)
    setParticipants(
      participants.map((p) =>
        p.id === id
          ? { ...p, contact_count: p.contact_count + 1, last_contacted_at: new Date() }
          : p
      )
    )
  }

  async function handleSaveTags(id: string) {
    const tags = JSON.stringify(tagInput.split(',').map((t) => t.trim()).filter(Boolean))
    await updateParticipant(id, { tags })
    setParticipants(participants.map((p) => (p.id === id ? { ...p, tags } : p)))
    setEditingTags(null)
  }

  function parseTags(tagsStr: string): string[] {
    try {
      return JSON.parse(tagsStr)
    } catch {
      return []
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search participants..."
          className="text-[12px] border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-neutral-400 w-48"
        />
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          + Add participant
        </button>
        <span className="text-[11px] text-neutral-400 ml-auto">
          {filtered.length} participant{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border border-neutral-200 rounded-lg p-4 mb-4 bg-neutral-50">
          <div className="flex items-end gap-3">
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Name</label>
              <input
                className="mt-1 block w-full text-[12px] border border-neutral-300 rounded px-2.5 py-1.5 outline-none focus:border-neutral-500"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Email</label>
              <input
                className="mt-1 block w-full text-[12px] border border-neutral-300 rounded px-2.5 py-1.5 outline-none focus:border-neutral-500"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Type</label>
              <select
                className="mt-1 block text-[12px] border border-neutral-300 rounded px-2.5 py-1.5 outline-none"
                value={addForm.user_type}
                onChange={(e) => setAddForm({ ...addForm, user_type: e.target.value })}
              >
                <option value="consumer">Consumer</option>
                <option value="restaurant_partner">Restaurant partner</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={!addForm.name.trim() || !addForm.email.trim()}
              className="text-[12px] font-medium px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-[12px] text-neutral-400 hover:text-neutral-600 px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Source</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Tags</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Last contact</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Count</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const tags = parseTags(p.tags)
              return (
                <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-700">{p.name}</td>
                  <td className="px-3 py-2 text-neutral-500">{p.email}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                      {p.user_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{p.source}</td>
                  <td className="px-3 py-2">
                    {editingTags === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          className="text-[11px] border border-neutral-300 rounded px-1.5 py-0.5 w-32 outline-none"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="tag1, tag2"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTags(p.id)}
                        />
                        <button onClick={() => handleSaveTags(p.id)} className="text-[10px] text-green-600 hover:underline">Save</button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => {
                          setEditingTags(p.id)
                          setTagInput(tags.join(', '))
                        }}
                      >
                        {tags.length > 0 ? (
                          tags.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-neutral-300">+ tags</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{formatDate(p.last_contacted_at)}</td>
                  <td className="px-3 py-2 text-neutral-500">{p.contact_count}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMarkContacted(p.id)}
                        className="text-[10px] text-neutral-400 hover:text-green-600"
                        title="Mark contacted"
                      >
                        Contacted
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-[10px] text-neutral-300 hover:text-red-500"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[13px] text-neutral-400 italic">
                  {participants.length === 0 ? 'No research participants yet.' : 'No matches.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
