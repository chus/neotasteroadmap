import type { Column, Criterion } from '@/types'

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

export const EFFORT_CONFIG: Record<string, { label: string; color: string }> = {
  xs: { label: 'XS', color: '#888780' },
  s:  { label: 'S',  color: '#1D9E75' },
  m:  { label: 'M',  color: '#378ADD' },
  l:  { label: 'L',  color: '#BA7517' },
  xl: { label: 'XL', color: '#D85A30' },
}

export const MONTHS_2026: { value: string; label: string }[] = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
]

export const MONTH_SHORT: Record<string, string> = {
  '2026-01': 'Jan', '2026-02': 'Feb', '2026-03': 'Mar',
  '2026-04': 'Apr', '2026-05': 'May', '2026-06': 'Jun',
  '2026-07': 'Jul', '2026-08': 'Aug', '2026-09': 'Sep',
  '2026-10': 'Oct', '2026-11': 'Nov', '2026-12': 'Dec',
}
