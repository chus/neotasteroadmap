import { getShippedInitiatives } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function ReleasesPage() {
  const groups = await getShippedInitiatives()
  // Only show public initiatives
  const publicGroups = groups
    .map((g) => ({
      ...g,
      initiatives: g.initiatives.filter((i) => i.is_public),
    }))
    .filter((g) => g.initiatives.length > 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-[28px] font-bold text-neutral-800 mb-2">Releases</h1>
        <p className="text-[14px] text-neutral-500 mb-10">
          What we&apos;ve shipped recently.
        </p>

        {publicGroups.length === 0 ? (
          <p className="text-[13px] text-neutral-400">No public releases yet.</p>
        ) : (
          <div className="space-y-10">
            {publicGroups.map((group) => (
              <div key={group.monthKey}>
                <h2 className="text-[14px] font-semibold text-neutral-700 mb-4">{group.month}</h2>
                <div className="space-y-4">
                  {group.initiatives.map((init) => (
                    <div key={init.id} className="border-l-2 border-green-400 pl-4">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-[14px] font-medium text-neutral-800">{init.title}</h3>
                        {init.released_at && (
                          <span className="text-[11px] text-neutral-400">
                            {new Date(init.released_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {init.release_note && (
                        <p className="text-[13px] text-neutral-600 mt-1">{init.release_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
