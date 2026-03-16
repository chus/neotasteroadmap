import { LINEAR_STATE_TO_COLUMN } from './linear'

export interface DriftField {
  field: string
  label: string
  roadmapValue: string
  linearValue: string
  severity: 'high' | 'medium' | 'low'
}

export interface DriftResult {
  // True only when high-severity drift exists (shows amber badge)
  hasDrift: boolean
  // All detected differences (including low-severity informational ones)
  fields: DriftField[]
}

// Drift is only detected for fields where the roadmap is the source of truth
// and Linear divergence represents a real sequencing decision that needs resolution.
//
// High severity (triggers amber badge + drift panel):
// - column: Linear state moved but roadmap column didn't follow
//
// Low severity (informational only, shown muted in slide-over):
// - title: Linear and roadmap titles often diverge intentionally
//
// Excluded from drift entirely:
// - target_month: roadmap-owned, Linear rarely has dates set (false positives)
// - progress / lead / members: Linear-owned enrichment, not roadmap fields

export function detectDrift(
  initiative: {
    column: string
    title: string
  },
  linearProject: {
    state: string
    name: string
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

  // Title (low severity — informational only, does NOT trigger drift badge)
  if (linearProject.name !== initiative.title) {
    fields.push({
      field: 'title',
      label: 'Title',
      roadmapValue: initiative.title,
      linearValue: linearProject.name,
      severity: 'low',
    })
  }

  const highSeverityFields = fields.filter((f) => f.severity === 'high')

  return {
    hasDrift: highSeverityFields.length > 0,
    fields,
  }
}
