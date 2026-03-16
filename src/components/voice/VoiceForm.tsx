'use client'

import { useState } from 'react'
import { submitFeedback } from '@/app/feedback-actions'

const CATEGORIES = [
  { id: 'experience', label: 'Experience', desc: 'Something about using the app' },
  { id: 'bug', label: 'Bug', desc: 'Something broken or unexpected' },
  { id: 'feature', label: 'Feature idea', desc: 'Something you wish existed' },
  { id: 'pricing', label: 'Pricing', desc: 'About offers, vouchers, or value' },
  { id: 'other', label: 'Other', desc: 'Anything else' },
]

const USER_TYPES = [
  { id: 'consumer', label: 'NeoTaste user' },
  { id: 'restaurant_partner', label: 'Restaurant partner' },
  { id: 'internal', label: 'NeoTaste team' },
]

const ORDER_CONTEXTS = [
  { id: 'dine_in', label: 'Dine-in' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'voucher', label: 'Voucher redemption' },
  { id: 'general', label: 'General / browsing' },
]

type Step = 'identity' | 'feedback' | 'context' | 'confirm'

export default function VoiceForm() {
  const [step, setStep] = useState<Step>('identity')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    user_type: 'consumer',
    category: '',
    title: '',
    body: '',
    restaurant_name: '',
    order_context: '',
    device: '',
    research_opt_in: false,
  })

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function canAdvanceIdentity() {
    return form.name.trim().length > 0
  }

  function canAdvanceFeedback() {
    return form.category && form.title.trim().length > 0 && form.body.trim().length > 10
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const result = await submitFeedback({
        name: form.name,
        email: form.email,
        user_type: form.user_type,
        category: form.category,
        title: form.title,
        body: form.body,
        restaurant_name: form.restaurant_name || undefined,
        order_context: form.order_context || undefined,
        device: form.device || undefined,
        research_opt_in: form.research_opt_in,
      })
      if (result.success) {
        setSubmittedId(result.id)
        setStep('confirm')
      }
    } catch {
      // Handle silently
    } finally {
      setSubmitting(false)
    }
  }

  // Step indicator
  const steps: Step[] = ['identity', 'feedback', 'context']
  const stepIndex = steps.indexOf(step)

  if (step === 'confirm') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-800 mb-2">Thank you!</h2>
        <p className="text-[14px] text-neutral-500 mb-4 leading-relaxed">
          Your feedback has been submitted. Our product team reviews every submission.
        </p>
        {form.research_opt_in && (
          <p className="text-[13px] text-green-700 bg-green-50 rounded-lg px-4 py-2 inline-block mb-4">
            You&apos;re on our research list — we may reach out.
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={() => {
              setForm({
                name: form.name,
                email: form.email,
                user_type: form.user_type,
                category: '',
                title: '',
                body: '',
                restaurant_name: '',
                order_context: '',
                device: '',
                research_opt_in: form.research_opt_in,
              })
              setSubmittedId(null)
              setStep('feedback')
            }}
            className="text-[13px] font-medium text-neutral-600 hover:text-neutral-800 underline"
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-green-500' : 'bg-neutral-200'
              }`}
            />
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${i < stepIndex ? 'bg-green-500' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
        <span className="text-[11px] text-neutral-400 ml-2">
          {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Step 1: Identity */}
      {step === 'identity' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">Who are you?</h2>
            <p className="text-[13px] text-neutral-500">So we can follow up if needed.</p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Name *</label>
            <input
              className="mt-1 w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Email (optional)</label>
            <input
              className="mt-1 w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="your@email.com"
            />
            <p className="text-[11px] text-neutral-400 mt-1">For follow-up and status updates. Never shared.</p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">I am a...</label>
            <div className="flex gap-2 mt-1.5">
              {USER_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update('user_type', t.id)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    form.user_type === t.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep('feedback')}
              disabled={!canAdvanceIdentity()}
              className="text-[13px] font-medium px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Feedback */}
      {step === 'feedback' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">What&apos;s this about?</h2>
            <p className="text-[13px] text-neutral-500">Describe a specific moment or experience.</p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => update('category', cat.id)}
                  className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                    form.category === cat.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className={`text-[12px] font-medium ${form.category === cat.id ? 'text-green-700' : 'text-neutral-700'}`}>
                    {cat.label}
                  </div>
                  <div className="text-[11px] text-neutral-400">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Describe the moment *</label>
            <input
              className="mt-1 w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Couldn't find vegan options near Mitte"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Tell us more *</label>
            <textarea
              className="mt-1 w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500 resize-none"
              rows={4}
              value={form.body}
              onChange={(e) => update('body', e.target.value)}
              placeholder="What happened? What did you expect? Why did it matter?"
            />
            <p className="text-[11px] text-neutral-400 mt-1">The more specific, the more useful.</p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep('identity')}
              className="text-[13px] font-medium px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('context')}
              disabled={!canAdvanceFeedback()}
              className="text-[13px] font-medium px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Context + Submit */}
      {step === 'context' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-800 mb-1">A bit more context</h2>
            <p className="text-[13px] text-neutral-500">Optional — but helps us understand your feedback better.</p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Restaurant (if relevant)</label>
            <input
              className="mt-1 w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
              value={form.restaurant_name}
              onChange={(e) => update('restaurant_name', e.target.value)}
              placeholder="Restaurant name"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">What were you doing?</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {ORDER_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => update('order_context', form.order_context === ctx.id ? '' : ctx.id)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    form.order_context === ctx.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {ctx.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Device</label>
            <div className="flex gap-2 mt-1.5">
              {['ios', 'android', 'web'].map((d) => (
                <button
                  key={d}
                  onClick={() => update('device', form.device === d ? '' : d)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    form.device === d
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {d === 'ios' ? 'iOS' : d === 'android' ? 'Android' : 'Web'}
                </button>
              ))}
            </div>
          </div>

          {/* Research opt-in */}
          <div className="border border-neutral-200 rounded-lg p-4 mt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.research_opt_in}
                onChange={(e) => update('research_opt_in', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-green-600"
              />
              <div>
                <div className="text-[13px] font-medium text-neutral-700">
                  I&apos;d be happy to chat with the NeoTaste team about this
                </div>
                <div className="text-[12px] text-neutral-400 mt-0.5">
                  We may invite you for a short interview or usability test. No obligation.
                </div>
              </div>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep('feedback')}
              className="text-[13px] font-medium px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-[13px] font-medium px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
