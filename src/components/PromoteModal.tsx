'use client'

import { useState, useRef, useEffect } from 'react'
import { COLUMNS, CRITERION_CONFIG } from '@/lib/constants'
import type { FeatureRequest, StrategicLevel, Column, Criterion } from '@/types'

interface Props {
  request: FeatureRequest
  strategicLevels: StrategicLevel[]
  onConfirm: (data: { column: Column; criterion: Criterion; strategicLevelId: string }) => void
  onClose: () => void
}

export default function PromoteModal({ request, strategicLevels, onConfirm, onClose }: Props) {
  const [column, setColumn] = useState<Column>('next')
  const [criterion, setCriterion] = useState<Criterion>('execution_ready')
  const [levelId, setLevelId] = useState(strategicLevels[0]?.id ?? '')
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="bg-white rounded-xl w-full max-w-sm p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-neutral-800">Promote to roadmap</h3>
        <p className="text-[12px] text-neutral-500 truncate">{request.title}</p>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Column</label>
          <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={column} onChange={(e) => setColumn(e.target.value as Column)}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Criterion</label>
          <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={criterion} onChange={(e) => setCriterion(e.target.value as Criterion)}>
            {(Object.entries(CRITERION_CONFIG) as [Criterion, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">Strategic level</label>
          <select className="mt-1 w-full text-[12px] border border-neutral-300 rounded-lg px-3 py-2 outline-none" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            {strategicLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-[12px] font-medium px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50">Cancel</button>
          <button onClick={() => onConfirm({ column, criterion, strategicLevelId: levelId })} className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">Confirm</button>
        </div>
      </div>
    </div>
  )
}
