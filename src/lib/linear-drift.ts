import { LINEAR_STATE_TO_COLUMN } from './linear'

export interface DriftField {
  field: string
  label: string
  roadmapValue: string
  linearValue: string
  severity: 'high' | 'medium' | 'low'
}

export interface DriftResult {
  hasDrift: boolean
  fields: DriftField[]
}

export function detectDrift(
  initiative: {
    column: string
    target_month: string | null
    title: string
    linear_progress: number | null
  },
  linearProject: {
    state: string
    targetDate: string | null
    name: string
    progress: number
  }
): DriftResult {
  const fields: DriftField[] = []

  // Column vs Linear state (high severity)
  const expectedColumn = LINEAR_STATE_TO_COLUMN[linearProject.state]
  if (expectedColumn && expectedColumn !== initiative.column) {
    fields.push({
      field: 'column',
      label: 'Column / State',
      roadmapValue: initiative.column,
      linearValue: `${linearProject.state} → ${expectedColumn}`,
      severity: 'high',
    })
  }

  // Target date (medium severity)
  const linearMonth = linearProject.targetDate ? linearProject.targetDate.substring(0, 7) : null
  if (linearMonth !== initiative.target_month) {
    fields.push({
      field: 'target_month',
      label: 'Target month',
      roadmapValue: initiative.target_month ?? 'none',
      linearValue: linearMonth ?? 'none',
      severity: 'medium',
    })
  }

  // Title (low severity)
  if (linearProject.name !== initiative.title) {
    fields.push({
      field: 'title',
      label: 'Title',
      roadmapValue: initiative.title,
      linearValue: linearProject.name,
      severity: 'low',
    })
  }

  // Progress newly available (low severity)
  if (initiative.linear_progress === null && linearProject.progress > 0) {
    fields.push({
      field: 'progress',
      label: 'Progress',
      roadmapValue: 'not tracked',
      linearValue: `${Math.round(linearProject.progress * 100)}%`,
      severity: 'low',
    })
  }

  return {
    hasDrift: fields.length > 0,
    fields,
  }
}
