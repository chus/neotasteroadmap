export type Criterion = 'execution_ready' | 'foundation' | 'dependency' | 'research' | 'parked'
export type Column = 'now' | 'next' | 'later' | 'parked' | 'released'

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
  linear_progress: number | null
  linear_issue_count: number | null
  linear_completed_issue_count: number | null
  linear_in_progress_issue_count: number | null
  linear_lead: string | null
  linear_members: string | null
  linear_start_date: string | null
  linear_target_date: string | null
  linear_updates: string | null
  linear_milestone: string | null
  sync_status: string | null
  sync_drift: string | null
  sync_drift_detected_at: Date | null
  sync_dismissed_at: Date | null
  released_at: Date | null
  release_note: string | null
  impact_metric: string | null
  impact_measured_at: Date | null
  shipped_by: string | null
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
  ai_triage: string | null
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

// ─── Voice / Feedback ───

export type FeedbackStatus = 'new' | 'reviewing' | 'actioned' | 'archived' | 'merged'
export type FeedbackCategory = 'bug' | 'feature' | 'experience' | 'pricing' | 'other'
export type UserType = 'consumer' | 'restaurant_partner' | 'internal'
export type OrderContext = 'dine_in' | 'takeaway' | 'voucher' | 'general'

export interface FeedbackSubmission {
  id: string
  name: string
  email: string
  user_type: UserType
  category: FeedbackCategory
  title: string
  body: string
  restaurant_name: string | null
  order_context: OrderContext | null
  device: string | null
  app_version: string | null
  ai_triage: string | null
  ai_triaged_at: Date | null
  status: FeedbackStatus
  internal_note: string
  actioned_initiative_id: string | null
  research_opt_in: boolean
  embedding: string | null
  cluster_id: string | null
  status_notified_at: Date | null
  created_at: Date
  reviewed_at: Date | null
  reviewed_by: string | null
}

export interface ResearchParticipant {
  id: string
  name: string
  email: string
  user_type: UserType
  source: string
  tags: string
  notes: string
  last_contacted_at: Date | null
  contact_count: number
  opted_in_at: Date
  created_at: Date
}

export type ClusterStatus = 'active' | 'resolved' | 'watching' | 'planned' | 'monitoring'

export interface FeedbackCluster {
  id: string
  label: string
  description: string
  theme: string
  submission_count: number
  avg_sentiment: string | null
  top_urgency: string | null
  status: ClusterStatus
  linked_initiative_id: string | null
  backlog_item_id: string | null
  created_at: Date
  updated_at: Date
}

export type BacklogStatus = 'watching' | 'backlog' | 'promoted' | 'declined'

export interface ProblemBacklogItem {
  id: string
  title: string
  description: string
  evidence: string
  strategic_area: string
  status: BacklogStatus
  watch_until: string | null
  declined_reason: string
  declined_at: Date | null
  promoted_at: Date | null
  roadmap_initiative_id: string | null
  source_cluster_id: string | null
  submission_count: number
  research_candidate_count: number
  representative_quote: string
  pm_notes: string
  priority_signal: string
  created_at: Date
  updated_at: Date
  // Joined fields
  initiative_title?: string
  cluster_label?: string
}

export interface AgentRunLogEntry {
  id: string
  run_date: string
  report: string
  slack_posted: boolean
  created_at: Date
}

// ─── Comms Digest ───

export type DigestStatus = 'draft' | 'approved' | 'sent' | 'skipped'

export interface CommsDigest {
  id: string
  period_label: string
  period_start: Date
  period_end: Date
  status: DigestStatus
  skip_reason: string
  draft_content: string
  email_html: string
  email_subject: string
  recipient_count: number
  sent_at: Date | null
  auto_send_at: Date | null
  pm_edited: boolean
  created_at: Date
}

export interface DigestRecipient {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: Date
}

export type SessionType = 'interview' | 'survey' | 'usability_test'

export interface ResearchSession {
  id: string
  participant_id: string
  session_type: SessionType
  topic: string
  notes: string
  conducted_by: string | null
  conducted_at: Date | null
  recording_url: string | null
  created_at: Date
}
