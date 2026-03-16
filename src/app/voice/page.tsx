import VoiceForm from '@/components/voice/VoiceForm'

export const dynamic = 'force-dynamic'

export default function VoicePage() {
  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="rounded-md">
              <rect width="28" height="28" rx="6" fill="#50E88A" />
              <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
            </svg>
            <span className="text-[15px] font-semibold text-neutral-800">NeoTaste</span>
          </div>
          <h1 className="text-[24px] font-semibold text-neutral-800 mb-2">
            Share your experience
          </h1>
          <p className="text-[14px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Help us make NeoTaste better. Tell us about a moment that mattered — good or bad.
          </p>
        </div>

        <VoiceForm />

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[11px] text-neutral-400">
            Your feedback is reviewed by the NeoTaste product team. We read everything.
          </p>
        </div>
      </div>
    </main>
  )
}
