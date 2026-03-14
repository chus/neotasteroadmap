export type Track = 'discovery' | 'conversion' | 'churn' | 'partner'
export type Criterion = 'execution_ready' | 'foundation' | 'dependency' | 'research' | 'parked'
export type Column = 'now' | 'next' | 'later' | 'parked'

export interface Initiative {
  id: string
  title: string
  subtitle: string
  track: Track
  criterion: Criterion
  column: Column
  position: number
  dep_note: string
  created_at: Date
}
