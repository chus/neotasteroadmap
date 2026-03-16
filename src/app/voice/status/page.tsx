import Link from 'next/link'
import StatusLookup from '@/components/voice/StatusLookup'

export const metadata = {
  title: 'Feedback Status — NeoTaste Voice',
}

export default function VoiceStatusPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-6 sm:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/neotaste-icon.png"
              alt="NeoTaste"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-[13px] font-medium text-neutral-500">Voice</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">
            Feedback status
          </h1>
          <p className="text-[13px] text-neutral-500">
            Check the status of feedback you&apos;ve submitted.
          </p>
        </div>

        <StatusLookup />

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <Link
            href="/voice"
            className="text-[12px] text-neutral-500 hover:text-neutral-700 underline"
          >
            Submit new feedback
          </Link>
        </div>
      </div>
    </main>
  )
}
