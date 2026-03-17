'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { CommsDigest, DigestRecipient } from '@/types'
import {
  generateMonthlyDigest,
  getDigestHistory,
  getDigestById,
  updateDigestContent,
  sendDigest,
  skipDigest,
  addDigestRecipient,
  addDigestRecipientsBulk,
  updateDigestRecipient,
  removeDigestRecipient,
  getDigestRecipients,
  sendTestEmail,
} from '@/app/actions'

interface Props {
  initialDigests: CommsDigest[]
  initialRecipients: DigestRecipient[]
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function countdownLabel(autoSendAt: Date): string {
  const diff = autoSendAt.getTime() - Date.now()
  if (diff <= 0) return 'Sending soon...'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `Auto-sends in ${hours}h ${mins}m`
  return `Auto-sends in ${mins}m`
}

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: '#FFF7E6', color: '#B7791F', label: 'Draft' },
    sent: { bg: '#E6FFF0', color: '#276749', label: 'Sent' },
    skipped: { bg: '#F5F5F5', color: '#888', label: 'Skipped' },
    approved: { bg: '#E8F4FD', color: '#2B6CB0', label: 'Approved' },
  }
  const s = styles[status] ?? styles.draft
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12 }}>
      {s.label}
    </span>
  )
}

const ROLE_COLORS: Record<string, string> = {
  Product: '#7F77DD',
  Engineering: '#3B82F6',
  Design: '#EC4899',
  Leadership: '#0D2818',
  Commercial: '#F59E0B',
}

function rolePillColor(role: string): string {
  return ROLE_COLORS[role] ?? '#888'
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

function nameFromEmail(email: string): string {
  const prefix = email.split('@')[0] ?? email
  return titleCase(prefix.replace(/[._]/g, ' '))
}

export default function CommsBoard({ initialDigests, initialRecipients }: Props) {
  const [digests, setDigests] = useState<CommsDigest[]>(initialDigests)
  const [recipients, setRecipients] = useState<DigestRecipient[]>(initialRecipients)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  // Slide-over state
  const [selectedDigest, setSelectedDigest] = useState<CommsDigest | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editHtml, setEditHtml] = useState('')
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [showSkipForm, setShowSkipForm] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState('')

  // Add recipient modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalEmail, setModalEmail] = useState('')
  const [modalRole, setModalRole] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [addingModal, setAddingModal] = useState(false)
  const [addResult, setAddResult] = useState('')

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')

  const refreshDigests = useCallback(async () => {
    const fresh = await getDigestHistory()
    setDigests(fresh)
  }, [])

  const refreshRecipients = useCallback(async () => {
    const fresh = await getDigestRecipients()
    setRecipients(fresh)
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const opts: { periodStart?: Date; periodEnd?: Date; periodLabel?: string } = {}
      if (periodStart) opts.periodStart = new Date(periodStart)
      if (periodEnd) opts.periodEnd = new Date(periodEnd)
      if (periodStart && periodEnd) {
        const s = new Date(periodStart)
        const e = new Date(periodEnd)
        opts.periodLabel = `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
      const result = await generateMonthlyDigest(opts)

      if ('error' in result && result.error) {
        setGenError(result.message ?? 'Generation failed')
        return
      }

      if (result.skipped) {
        setGenError(`Skipped: ${result.reason}`)
      }

      await refreshDigests()
      if (result.id) {
        const d = await getDigestById(result.id)
        if (d) openSlideOver(d)
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const openSlideOver = (digest: CommsDigest) => {
    setSelectedDigest(digest)
    setEditSubject(digest.email_subject)
    setEditHtml(digest.email_html)
    setShowHtmlEditor(false)
    setShowSkipForm(false)
    setSkipReason('')
    setTestEmail('')
    setTestResult('')
  }

  const closeSlideOver = () => setSelectedDigest(null)

  const handleSave = async () => {
    if (!selectedDigest) return
    setSaving(true)
    await updateDigestContent(selectedDigest.id, editHtml, editSubject)
    const updated = await getDigestById(selectedDigest.id)
    if (updated) setSelectedDigest(updated)
    await refreshDigests()
    setSaving(false)
  }

  const handleSend = async () => {
    if (!selectedDigest) return
    setSending(true)
    await sendDigest(selectedDigest.id)
    const updated = await getDigestById(selectedDigest.id)
    if (updated) setSelectedDigest(updated)
    await refreshDigests()
    setSending(false)
  }

  const handleSkip = async () => {
    if (!selectedDigest) return
    setSkipping(true)
    await skipDigest(selectedDigest.id, skipReason)
    const updated = await getDigestById(selectedDigest.id)
    if (updated) setSelectedDigest(updated)
    await refreshDigests()
    setSkipping(false)
    setShowSkipForm(false)
  }

  const handleTestSend = async () => {
    if (!selectedDigest || !testEmail) return
    setTestSending(true)
    setTestResult('')
    const result = await sendTestEmail(selectedDigest.id, testEmail)
    setTestResult(result.success ? 'Sent!' : result.error ?? 'Failed')
    setTestSending(false)
  }

  const handleRemoveRecipient = async (id: string) => {
    await removeDigestRecipient(id)
    setRecipients(prev => prev.filter(r => r.id !== id))
  }

  // Modal add logic
  const parseBulkEmails = (raw: string): { email: string; name: string }[] => {
    return raw
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.includes('@'))
      .map(email => ({ email, name: nameFromEmail(email) }))
  }

  const duplicateWarnings = (() => {
    const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()))
    const warnings: string[] = []
    if (modalEmail && existingEmails.has(modalEmail.toLowerCase().trim())) {
      warnings.push(modalEmail.trim())
    }
    if (bulkEmails) {
      for (const parsed of parseBulkEmails(bulkEmails)) {
        if (existingEmails.has(parsed.email.toLowerCase())) {
          warnings.push(parsed.email)
        }
      }
    }
    return warnings
  })()

  const hasValidInput = modalEmail.includes('@') || parseBulkEmails(bulkEmails).length > 0

  const handleModalAdd = async () => {
    setAddingModal(true)
    setAddResult('')

    const entries: { email: string; name: string; role: string }[] = []

    // Single add
    if (modalEmail.includes('@')) {
      entries.push({ email: modalEmail.trim(), name: modalName || nameFromEmail(modalEmail), role: modalRole })
    }

    // Bulk add
    for (const parsed of parseBulkEmails(bulkEmails)) {
      // Don't duplicate if already added via single field
      if (!entries.some(e => e.email.toLowerCase() === parsed.email.toLowerCase())) {
        entries.push({ email: parsed.email, name: parsed.name, role: modalRole })
      }
    }

    if (entries.length === 0) { setAddingModal(false); return }

    const result = await addDigestRecipientsBulk(entries)
    const names = entries.map(e => e.name)
    const parts: string[] = []
    if (result.added > 0) parts.push(`${result.added} added`)
    if (result.reactivated > 0) parts.push(`${result.reactivated} reactivated`)
    setAddResult(`${entries.length} recipient(s) processed (${parts.join(', ')}): ${names.join(', ')}`)

    await refreshRecipients()
    setAddingModal(false)
    setTimeout(() => {
      setShowAddModal(false)
      setModalName('')
      setModalEmail('')
      setModalRole('')
      setBulkEmails('')
      setAddResult('')
    }, 2000)
  }

  // Inline edit handlers
  const startEditing = (r: DigestRecipient) => {
    setEditingId(r.id)
    setEditName(r.name)
    setEditRole(r.role)
  }

  const saveInlineEdit = async (id: string) => {
    await updateDigestRecipient(id, { name: editName, role: editRole })
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, name: editName, role: editRole } : r))
    setEditingId(null)
  }

  // Compute role summary
  const uniqueRoles = [...new Set(recipients.map(r => r.role).filter(Boolean))]

  const thStyle = { textAlign: 'left' as const, padding: '10px 16px', fontWeight: 600, color: '#999', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Header */}
      <div style={{ background: '#0D2818', padding: '40px 0 36px' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-end justify-between">
          <div>
            <p style={{ color: '#50E88A', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Monthly Comms
            </p>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 6 }}>
              Stakeholder Digest
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
              Auto-generated monthly digest of what shipped, what moved, and what users are saying.
            </p>
          </div>
          <Link
            href="/comms/preview"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Preview latest &rarr;
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Generate Section */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0D2818', margin: '0 0 4px' }}>Generate a digest</h2>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
            Leave dates empty to use last calendar month. Custom dates work for mid-month or catch-up digests.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                style={{ display: 'block', marginTop: 4, padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                style={{ display: 'block', marginTop: 4, padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 20px',
                background: generating ? '#ccc' : '#0D2818',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? 'Generating...' : 'Generate digest'}
            </button>
          </div>
          {genError && (
            <p style={{ color: '#B7791F', fontSize: 13, marginTop: 12, background: '#FFF7E6', padding: '8px 12px', borderRadius: 6 }}>
              {genError}
            </p>
          )}
        </div>

        {/* Digest History */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0D2818', margin: '0 0 16px' }}>Digest history</h2>
        {digests.length === 0 && (
          <p style={{ fontSize: 14, color: '#888' }}>No digests yet. Generate your first one above.</p>
        )}
        <div className="grid gap-3">
          {digests.map(d => (
            <div
              key={d.id}
              style={{
                background: '#fff',
                border: `1px solid ${d.status === 'sent' ? '#50E88A' : d.status === 'skipped' ? '#ddd' : '#E8E8E8'}`,
                borderLeftWidth: 4,
                borderLeftColor: d.status === 'sent' ? '#1D9E75' : d.status === 'skipped' ? '#ccc' : '#F6AD55',
                borderRadius: 8,
                padding: '16px 20px',
                transition: 'box-shadow 0.15s',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => openSlideOver(d)}
                  className="flex items-center gap-3 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1 }}
                >
                  {statusBadge(d.status)}
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#0D2818' }}>{d.period_label}</span>
                </button>
                <div className="flex items-center gap-3" style={{ fontSize: 12, color: '#999' }}>
                  {d.status === 'draft' && d.auto_send_at && (
                    <span style={{ color: '#B7791F', fontWeight: 500 }}>
                      {countdownLabel(new Date(d.auto_send_at))}
                    </span>
                  )}
                  {d.status === 'sent' && d.sent_at && (
                    <span>Sent {timeAgo(new Date(d.sent_at))} to {d.recipient_count}</span>
                  )}
                  {d.status === 'skipped' && d.skip_reason && (
                    <span>{d.skip_reason}</span>
                  )}
                  <span>{new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <Link
                    href="/comms/preview"
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: '1px solid #E8E8E8',
                      color: '#888',
                      textDecoration: 'none',
                    }}
                  >
                    Preview
                  </Link>
                </div>
              </div>
              {d.email_subject && (
                <p style={{ fontSize: 13, color: '#666', marginTop: 6, marginBottom: 0 }}>
                  {d.email_subject}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Recipients Section */}
        <div style={{ marginTop: 48 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0D2818', margin: '0 0 6px' }}>Recipients</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 13, color: '#888' }}>
                  {recipients.length} active recipient{recipients.length !== 1 ? 's' : ''}
                  {uniqueRoles.length > 0 && ` across ${uniqueRoles.length} role${uniqueRoles.length !== 1 ? 's' : ''}`}
                </span>
                {uniqueRoles.map(role => (
                  <span
                    key={role}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: `${rolePillColor(role)}18`,
                      color: rolePillColor(role),
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setAddResult('') }}
              style={{
                fontSize: 13,
                padding: '7px 14px',
                borderRadius: 6,
                border: '1px solid #ddd',
                background: '#fff',
                color: '#333',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              + Add recipient
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E8E8' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={{ width: 60, padding: '10px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {recipients.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '10px 16px', color: '#333' }}>
                      {editingId === r.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => saveInlineEdit(r.id)}
                          onKeyDown={e => e.key === 'Enter' && saveInlineEdit(r.id)}
                          autoFocus
                          style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, width: '100%' }}
                        />
                      ) : (
                        <span
                          onClick={() => startEditing(r)}
                          style={{ cursor: 'pointer', borderBottom: '1px dashed transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.borderBottomColor = '#ccc')}
                          onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                        >
                          {r.name}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#666' }}>{r.email}</td>
                    <td style={{ padding: '10px 16px', color: '#888' }}>
                      {editingId === r.id ? (
                        <input
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          onBlur={() => saveInlineEdit(r.id)}
                          onKeyDown={e => e.key === 'Enter' && saveInlineEdit(r.id)}
                          placeholder="Role"
                          style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, width: '100%' }}
                        />
                      ) : (
                        <span
                          onClick={() => startEditing(r)}
                          style={{ cursor: 'pointer', borderBottom: '1px dashed transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.borderBottomColor = '#ccc')}
                          onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                        >
                          {r.role || '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        onClick={() => handleRemoveRecipient(r.id)}
                        style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div
            className="relative bg-white rounded-xl"
            style={{ width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: 28 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0D2818', margin: '0 0 4px' }}>Add recipient</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
              They&apos;ll receive the next monthly digest and all future ones.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  placeholder="First name or full name"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  value={modalEmail}
                  onChange={e => setModalEmail(e.target.value)}
                  placeholder="name@neotaste.app"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Role (optional)</label>
                <input
                  value={modalRole}
                  onChange={e => setModalRole(e.target.value)}
                  placeholder="e.g. Product, Engineering, Design, Leadership, Commercial"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 16, marginTop: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Or paste multiple emails</label>
                <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 6px' }}>
                  One per line, or comma-separated. Names will be set from the email prefix until updated.
                </p>
                <textarea
                  value={bulkEmails}
                  onChange={e => setBulkEmails(e.target.value)}
                  placeholder={`agus@neotaste.app, thomas@neotaste.app\njana@neotaste.app`}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Duplicate warnings */}
            {duplicateWarnings.length > 0 && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFF7E6', borderRadius: 6, fontSize: 12, color: '#B7791F' }}>
                {duplicateWarnings.map(email => (
                  <div key={email}>{email} is already in the list — it will be reactivated.</div>
                ))}
              </div>
            )}

            {/* Success result */}
            {addResult && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#E6FFF0', borderRadius: 6, fontSize: 12, color: '#276749' }}>
                {addResult}
              </div>
            )}

            <div className="flex gap-2 justify-end" style={{ marginTop: 20 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleModalAdd}
                disabled={addingModal || !hasValidInput}
                style={{
                  padding: '8px 20px',
                  background: !hasValidInput ? '#ccc' : '#1D9E75',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: !hasValidInput ? 'not-allowed' : 'pointer',
                }}
              >
                {addingModal ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selectedDigest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closeSlideOver} />
          <div
            className="relative bg-white h-full overflow-y-auto"
            style={{ width: 560, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
          >
            {/* Slide-over header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  {statusBadge(selectedDigest.status)}
                  <span style={{ fontSize: 13, color: '#888' }}>{selectedDigest.period_label}</span>
                </div>
                {selectedDigest.status === 'draft' && selectedDigest.auto_send_at && (
                  <p style={{ fontSize: 12, color: '#B7791F', margin: '4px 0 0' }}>
                    {countdownLabel(new Date(selectedDigest.auto_send_at))}
                  </p>
                )}
              </div>
              <button
                onClick={closeSlideOver}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#999', cursor: 'pointer', padding: '4px 8px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  Subject line
                </label>
                {selectedDigest.status === 'draft' ? (
                  <input
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
                  />
                ) : (
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{selectedDigest.email_subject}</p>
                )}
              </div>

              {/* Preview */}
              <div style={{ marginBottom: 20 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preview
                  </label>
                  {selectedDigest.status === 'draft' && (
                    <button
                      onClick={() => setShowHtmlEditor(!showHtmlEditor)}
                      style={{ fontSize: 12, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      {showHtmlEditor ? 'Show preview' : 'Edit HTML'}
                    </button>
                  )}
                </div>
                {showHtmlEditor && selectedDigest.status === 'draft' ? (
                  <textarea
                    value={editHtml}
                    onChange={e => setEditHtml(e.target.value)}
                    style={{
                      width: '100%',
                      height: 400,
                      padding: 12,
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden', background: '#F5F5F5' }}>
                    <iframe
                      srcDoc={selectedDigest.status === 'draft' ? editHtml : selectedDigest.email_html}
                      style={{ width: '100%', height: 500, border: 'none' }}
                      title="Email preview"
                      sandbox=""
                    />
                  </div>
                )}
              </div>

              {/* Actions for draft */}
              {selectedDigest.status === 'draft' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        background: '#0D2818',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        background: '#1D9E75',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: sending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {sending ? 'Sending...' : `Send to ${recipients.length} recipients`}
                    </button>
                  </div>

                  {/* Skip */}
                  {!showSkipForm ? (
                    <button
                      onClick={() => setShowSkipForm(true)}
                      style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      Skip this digest...
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={skipReason}
                        onChange={e => setSkipReason(e.target.value)}
                        placeholder="Reason for skipping"
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                      />
                      <button
                        onClick={handleSkip}
                        disabled={skipping}
                        style={{ padding: '6px 14px', background: '#F5F5F5', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                      >
                        {skipping ? '...' : 'Skip'}
                      </button>
                    </div>
                  )}

                  {/* Test send */}
                  <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 16, marginTop: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                      Send test email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                      />
                      <button
                        onClick={handleTestSend}
                        disabled={testSending || !testEmail}
                        style={{
                          padding: '7px 14px',
                          background: !testEmail ? '#eee' : '#F5F5F5',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: !testEmail ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {testSending ? 'Sending...' : 'Send test'}
                      </button>
                    </div>
                    {testResult && (
                      <p style={{ fontSize: 12, color: testResult === 'Sent!' ? '#1D9E75' : '#E53E3E', marginTop: 6 }}>
                        {testResult}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sent info */}
              {selectedDigest.status === 'sent' && selectedDigest.sent_at && (
                <div style={{ background: '#E6FFF0', borderRadius: 8, padding: 16, fontSize: 13, color: '#276749' }}>
                  Sent on {new Date(selectedDigest.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} to {selectedDigest.recipient_count} recipients
                  {selectedDigest.pm_edited && <span style={{ marginLeft: 8, fontSize: 11, color: '#888' }}>(edited before sending)</span>}
                </div>
              )}

              {/* Skipped info */}
              {selectedDigest.status === 'skipped' && (
                <div style={{ background: '#F5F5F5', borderRadius: 8, padding: 16, fontSize: 13, color: '#888' }}>
                  Skipped{selectedDigest.skip_reason ? `: ${selectedDigest.skip_reason}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
