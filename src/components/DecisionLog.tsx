'use client'

import { useState, useEffect } from 'react'
import { getDecisionLog, createDecisionEntry, updateDecisionEntry, deleteDecisionEntry } from '@/app/actions'
import type { DecisionEntry } from '@/types'

interface Props {
  initiativeId: string
}

const emptyForm = { decision: '', rationale: '', made_by: '', decided_at: new Date().toISOString().split('T')[0] }

export default function DecisionLog({ initiativeId }: Props) {
  const [entries, setEntries] = useState<DecisionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getDecisionLog(initiativeId)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [initiativeId])

  function startEdit(entry: DecisionEntry) {
    setEditingId(entry.id)
    setForm({
      decision: entry.decision,
      rationale: entry.rationale,
      made_by: entry.made_by,
      decided_at: entry.decided_at,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.decision.trim()) return
    setSaving(true)

    if (editingId) {
      await updateDecisionEntry(editingId, form)
      setEntries((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, ...form } : e))
      )
    } else {
      const entry = await createDecisionEntry(initiativeId, form)
      setEntries((prev) => [entry, ...prev])
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this decision entry?')) return
    await deleteDecisionEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  if (loading) return null

  return (
    <section>
      <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Decision log</div>

      {entries.length === 0 && !showForm ? (
        <p className="text-[12px] text-neutral-400 italic">
          No decisions logged yet.{' '}
          <button
            onClick={() => setShowForm(true)}
            className="text-neutral-500 hover:text-neutral-700 underline not-italic"
          >
            Add first decision
          </button>
        </p>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="relative pl-5 pb-4 group">
                {/* Timeline line */}
                {idx < entries.length - 1 && (
                  <div
                    className="absolute left-[5px] top-[10px] bottom-0 w-px"
                    style={{ backgroundColor: '#e5e5e5' }}
                  />
                )}
                {/* Dot */}
                <div
                  className="absolute left-0 top-[5px] w-[10px] h-[10px] rounded-full border-2"
                  style={{ borderColor: '#d4d4d4', backgroundColor: '#fff' }}
                />
                {/* Content */}
                <div>
                  <div className="text-[11px] text-neutral-400 mb-0.5">
                    {new Date(entry.decided_at + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-[13px] font-medium text-neutral-800 leading-snug">
                    {entry.decision}
                  </div>
                  {entry.rationale && (
                    <p className="text-[12px] text-neutral-500 leading-relaxed mt-1">
                      {entry.rationale}
                      {entry.made_by && (
                        <span className="text-[11px] text-neutral-400 italic"> — {entry.made_by}</span>
                      )}
                    </p>
                  )}
                  {/* Hover actions */}
                  <div className="hidden group-hover:flex items-center gap-2 mt-1">
                    <button
                      onClick={() => startEdit(entry)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-[10px] text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 mt-1"
            >
              + Log a decision
            </button>
          )}
        </>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="mt-3 space-y-2 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
          <input
            className="w-full text-[13px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white"
            placeholder="What was decided?"
            value={form.decision}
            onChange={(e) => setForm({ ...form, decision: e.target.value })}
            autoFocus
          />
          <textarea
            className="w-full text-[12px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white resize-y"
            rows={2}
            placeholder="Why was this the right call?"
            value={form.rationale}
            onChange={(e) => setForm({ ...form, rationale: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="text-[12px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white"
              placeholder="Name or role"
              value={form.made_by}
              onChange={(e) => setForm({ ...form, made_by: e.target.value })}
            />
            <input
              type="date"
              className="text-[12px] border border-neutral-200 rounded-md px-2.5 py-2 outline-none focus:border-[#50E88A] bg-white"
              value={form.decided_at}
              onChange={(e) => setForm({ ...form, decided_at: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!form.decision.trim() || saving}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40"
            >
              {saving ? 'Saving...' : editingId ? 'Save' : 'Log decision'}
            </button>
            <button
              onClick={handleCancel}
              className="text-[12px] text-neutral-400 hover:text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
