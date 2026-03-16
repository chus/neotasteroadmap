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

export type Phase = 'discovery' | 'definition' | 'build' | 'launch' | 'done'

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
  effort: string | null
  target_month: string | null
  is_public: boolean
  is_parent: boolean
  parent_initiative_id: string | null
  parent_color: string | null
  parent_title?: string
  phase: Phase | null
  confidence_problem: number | null
  confidence_solution: number | null
  linear_project_id: string | null
  linear_url: string | null
  linear_state: string | null
  linear_synced_at: Date | null
  linear_sync_enabled: boolean
  created_at: Date
}

export interface KeyAccount {
  id: string
  name: string
  company: string
  logo_url: string
  position: number
  created_at: Date
}

export interface KeyAccountInitiative {
  id: string
  key_account_id: string
  initiative_id: string
  note: string
  created_at: Date
}

export interface ReactionCount {
  emoji: string
  count: number
  reacted: boolean
}

export interface DecisionEntry {
  id: string
  initiative_id: string
  decision: string
  rationale: string
  made_by: string
  decided_at: string
  created_at: Date
}

export interface DigestSubscriber {
  id: string
  email: string
  name: string
  is_active: boolean
  subscribed_at: Date
}

export interface LinearSyncLogEntry {
  id: string
  initiative_id: string
  initiative_title: string
  direction: 'push' | 'pull'
  status: 'success' | 'failed'
  linear_project_id: string | null
  changes: string | null
  error_message: string | null
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
  submitter_email: string
  status: RequestStatus
  admin_note: string
  roadmap_initiative_id: string | null
  vote_count: number
  created_at: Date
}

export interface RequestComment {
  id: string
  request_id: string
  parent_id: string | null
  author_name: string
  author_role: string
  body: string
  is_team_response: boolean
  created_at: Date
  replies?: RequestComment[]
}
