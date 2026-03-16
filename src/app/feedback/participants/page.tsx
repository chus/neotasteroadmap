import { getResearchParticipants } from '@/app/feedback-actions'
import ParticipantsList from '@/components/voice/ParticipantsList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage() {
  const participants = await getResearchParticipants()

  return (
    <main className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/feedback" className="text-[13px] text-neutral-400 hover:text-neutral-600">
              Voice
            </Link>
            <span className="text-[13px] text-neutral-300">/</span>
            <span className="text-[13px] text-neutral-600">Participants</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-800">
            Research participants
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Users who opted in to participate in research through Voice or were added manually.
          </p>
        </div>
      </div>

      <ParticipantsList initialParticipants={participants} />
    </main>
  )
}
