'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { searchFeatureRequests, voteOnRequest } from '@/app/actions'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open:         { bg: '#F1F1F1', text: '#666', label: 'Open' },
  under_review: { bg: '#E6F1FB', text: '#0C447C', label: 'Under review' },
  planned:      { bg: '#EEEDFE', text: '#3C3489', label: 'Planned' },
  declined:     { bg: '#FEE9E9', text: '#9B1C1C', label: 'Declined' },
  promoted:     { bg: '#E1F5EE', text: '#085041', label: 'Promoted' },
}

interface Props {
  onSubmit: (data: {
    title: string
    customer_problem: string
    current_behaviour: string
    desired_outcome: string
    success_metric: string
    customer_evidence: string
    submitter_name: string
    submitter_role: string
    submitter_email: string
  }) => void
  onClose: () => void
}

const fields = [
  { key: 'title', label: 'One-line summary', helper: 'Describe the feature in plain language. Not a solution — a capability.', type: 'input', required: true },
  { key: 'customer_problem', label: 'Who has this problem, and what is it?', helper: "Be specific. 'Users want X' is not enough. Describe a real segment and a real moment of friction.", type: 'textarea', required: true },
  { key: 'current_behaviour', label: 'What happens today without this?', helper: "What's the workaround? What breaks down? What do users do instead?", type: 'textarea', required: true },
  { key: 'desired_outcome', label: 'What should happen instead?', helper: "Describe the outcome, not the feature. 'The user can see X' not 'We should build Y'.", type: 'textarea', required: true },
  { key: 'success_metric', label: 'How would we know it worked?', helper: "Name a metric or observable behaviour. 'Redemption rate increases' or 'CS tickets about X drop'.", type: 'input', required: true },
  { key: 'customer_evidence', label: 'Evidence', helper: "Paste quotes, ticket numbers, survey data, or session replay links. Vague references don't count.", type: 'textarea', required: true },
  { key: 'submitter_name', label: 'Your name', helper: '', type: 'input', required: true },
  { key: 'submitter_role', label: 'Your role', helper: 'e.g. Restaurant partner, Customer success, Marketing', type: 'input', required: false },
  { key: 'submitter_email', label: 'Your email', helper: "We'll notify you when the status of your request changes. Nothing else.", type: 'email', required: false },
] as const

type FormData = {
  title: string
  customer_problem: string
  current_behaviour: string
  desired_outcome: string
  success_metric: string
  customer_evidence: string
  submitter_name: string
  submitter_role: string
  submitter_email: string
}

const emptyForm: FormData = {
  title: '',
  customer_problem: '',
  current_behaviour: '',
  desired_outcome: '',
  success_metric: '',
  customer_evidence: '',
  submitter_name: '',
  submitter_role: '',
  submitter_email: '',
}

const requiredKeys: (keyof FormData)[] = [
  'title', 'customer_problem', 'current_behaviour',
  'desired_outcome', 'success_metric', 'customer_evidence', 'submitter_name',
]

export default function RequestModal({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<FormData>(emptyForm)
  const [duplicates, setDuplicates] = useState<{ id: string; title: string; vote_count: number; status: string }[]>([])
  const [searchingDupes, setSearchingDupes] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  const filledCount = requiredKeys.filter((k) => form[k].trim().length > 0).length
  const allFilled = filledCount === requiredKeys.length

  const searchDuplicates = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 5) {
      setDuplicates([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearchingDupes(true)
      try {
        const results = await searchFeatureRequests(query)
        setDuplicates(results.slice(0, 3))
      } finally {
        setSearchingDupes(false)
      }
    }, 400)
  }, [])

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'title') {
      searchDuplicates(value)
    }
  }

  async function handleVoteDuplicate(id: string) {
    await voteOnRequest(id)
    onClose()
    window.location.href = `/requests#${id}`
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-40 bg-black/30 flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-lg my-8 p-6">
        <h2 className="text-[16px] font-semibold text-neutral-800">Suggest a feature</h2>
        <p className="text-[12px] text-neutral-500 mt-1 mb-4">
          We review every submission. The more specific your evidence, the more likely it moves forward.
        </p>

        <div className="text-[11px] text-neutral-400 mb-4">
          {filledCount} of {requiredKeys.length} required fields complete
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-[12px] font-medium text-neutral-700">
                {f.label}{f.required && ' *'}
              </label>
              {f.helper && (
                <p className="text-[11px] text-neutral-400 mt-0.5 mb-1">{f.helper}</p>
              )}
              {f.type === 'textarea' ? (
                <textarea
                  className="w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500 resize-none"
                  rows={3}
                  value={form[f.key as keyof FormData]}
                  onChange={(e) => update(f.key as keyof FormData, e.target.value)}
                />
              ) : (
                <input
                  type={f.type === 'email' ? 'email' : 'text'}
                  className={`w-full text-[13px] border rounded-lg px-3 py-2 outline-none focus:border-neutral-500 ${
                    f.key === 'title' && duplicates.length > 0
                      ? 'border-amber-400'
                      : 'border-neutral-300'
                  }`}
                  value={form[f.key as keyof FormData]}
                  onChange={(e) => update(f.key as keyof FormData, e.target.value)}
                />
              )}
              {f.key === 'title' && duplicates.length > 0 && (
                <div className="mt-2 border border-amber-200 rounded-lg bg-amber-50 p-3">
                  <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-2">
                    Similar requests already submitted
                  </div>
                  <div className="space-y-2">
                    {duplicates.map((d) => {
                      const statusConf = STATUS_COLORS[d.status] ?? STATUS_COLORS.open
                      return (
                        <div key={d.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[13px] font-medium text-neutral-800 truncate">{d.title}</span>
                            <span
                              className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: statusConf.bg, color: statusConf.text }}
                            >
                              {statusConf.label}
                            </span>
                            <span className="shrink-0 text-[10px] text-neutral-400">{d.vote_count} votes</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVoteDuplicate(d.id)}
                            className="shrink-0 text-[11px] font-medium text-amber-700 hover:text-amber-900"
                          >
                            Vote on this instead
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2">If your request is different, continue below.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!allFilled}
            className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit request
          </button>
        </div>
      </div>
    </div>
  )
}
