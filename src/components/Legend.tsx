import { CRITERION_CONFIG } from '@/lib/constants'

export default function Legend() {
  return (
    <div className="flex gap-4 mt-6 flex-wrap">
      {Object.values(CRITERION_CONFIG).map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: c.border }}
          />
          <span className="text-[11px] text-neutral-500">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
