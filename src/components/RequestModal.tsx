'use client'

import { useState, useRef, useEffect } from 'react'

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
}

const requiredKeys: (keyof FormData)[] = [
  'title', 'customer_problem', 'current_behaviour',
  'desired_outcome', 'success_metric', 'customer_evidence', 'submitter_name',
]

export default function RequestModal({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<FormData>(emptyForm)
  const backdropRef = useRef<HTMLDivElement>(null)

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

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
                  className="w-full text-[13px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-neutral-500"
                  value={form[f.key as keyof FormData]}
                  onChange={(e) => update(f.key as keyof FormData, e.target.value)}
                />
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
