import type { Initiative } from '@/types'
import { CRITERION_CONFIG, EFFORT_CONFIG, MONTHS_2026 } from './constants'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateCSV(initiatives: Initiative[]): string {
  const headers = [
    'Title',
    'Subtitle',
    'Column',
    'Strategic Level',
    'Primary Criterion',
    'Secondary Criterion',
    'Effort',
    'Target Month',
    'Dependency Note',
    'Public',
    'Created At',
  ]

  const rows = initiatives.map((i) => [
    i.title,
    i.subtitle,
    i.column,
    i.strategic_level_name || '',
    CRITERION_CONFIG[i.criterion]?.label ?? i.criterion,
    i.criterion_secondary ? (CRITERION_CONFIG[i.criterion_secondary]?.label ?? i.criterion_secondary) : '',
    i.effort ? (EFFORT_CONFIG[i.effort]?.label ?? i.effort) : '',
    i.target_month ? (MONTHS_2026.find((m) => m.value === i.target_month)?.label ?? i.target_month) : '',
    i.dep_note,
    i.is_public ? 'Yes' : 'No',
    new Date(i.created_at).toISOString().split('T')[0],
  ])

  const lines = [headers, ...rows].map((row) => row.map(escapeCSV).join(','))
  return lines.join('\n')
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
