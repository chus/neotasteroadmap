import type { Column, Criterion, Track } from '@/types'

export const COLUMNS: { id: Column; label: string; sublabel: string }[] = [
  { id: 'now', label: 'Now', sublabel: 'Q1–Q2' },
  { id: 'next', label: 'Next', sublabel: 'Q2–Q3' },
  { id: 'later', label: 'Later', sublabel: 'Q3–Q4' },
  { id: 'parked', label: 'Parked', sublabel: 'Out of scope 2026' },
]

export const CRITERION_CONFIG: Record<Criterion, { label: string; color: string; bg: string; border: string; badge: string }> = {
  execution_ready: { label: 'Execution ready', color: '#085041', bg: '#E1F5EE', border: '#5DCAA5', badge: '#E1F5EE' },
  foundation:      { label: 'Foundation work', color: '#0C447C', bg: '#E6F1FB', border: '#85B7EB', badge: '#E6F1FB' },
  dependency:      { label: 'Team dependency', color: '#633806', bg: '#FAEEDA', border: '#EF9F27', badge: '#FAEEDA' },
  research:        { label: 'Research needed', color: '#3C3489', bg: '#EEEDFE', border: '#AFA9EC', badge: '#EEEDFE' },
  parked:          { label: 'Parked',           color: '#444441', bg: '#F1EFE8', border: '#B4B2A9', badge: '#F1EFE8' },
}

export const TRACK_LABELS: Record<Track, string> = {
  discovery: 'Discovery',
  conversion: 'Trial conversion',
  churn: 'Churn',
  partner: 'Partner',
}
