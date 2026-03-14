export type Criterion = 'execution_ready' | 'foundation' | 'dependency' | 'research' | 'parked'
export type Column = 'now' | 'next' | 'later' | 'parked'

export interface StrategicLevel {
  id: string
  name: string
  color: string
  description: string
  position: number
  created_at: Date
}

export interface Initiative {
  id: string
  title: string
  subtitle: string
  strategic_level_id: string | null
  strategic_level_name: string
  strategic_level_color: string
  criterion: Criterion
  criterion_secondary: Criterion | null
  column: Column
  position: number
  dep_note: string
  created_at: Date
}

export type RequestStatus = 'open' | 'under_review' | 'planned' | 'declined' | 'promoted'

export interface FeatureRequest {
  id: string
  title: string
  customer_problem: string
  current_behaviour: string
  desired_outcome: string
  success_metric: string
  customer_evidence: string
  submitter_name: string
  submitter_role: string
  status: RequestStatus
  admin_note: string
  roadmap_initiative_id: string | null
  vote_count: number
  created_at: Date
}
