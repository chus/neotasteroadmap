import type { Column, Criterion, Phase } from '@/types'

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

export const PHASE_CONFIG: Record<Phase, { label: string; color: string }> = {
  discovery:  { label: 'Discovery',  color: '#8B5CF6' },
  definition: { label: 'Definition', color: '#3B82F6' },
  build:      { label: 'Build',      color: '#F59E0B' },
  launch:     { label: 'Launch',     color: '#10B981' },
  done:       { label: 'Done',       color: '#6B7280' },
}

export interface InitiativeTemplate {
  id: string
  label: string
  description: string
  defaults: {
    criterion: Criterion
    criterion_secondary: Criterion | null
    effort: string
    dep_note: string
    subtitle: string
  }
}

export const INITIATIVE_TEMPLATES: InitiativeTemplate[] = [
  {
    id: 'new_feature',
    label: 'New feature',
    description: 'A user-facing capability that is scoped and ready to build.',
    defaults: {
      criterion: 'execution_ready',
      criterion_secondary: null,
      effort: 'm',
      dep_note: '',
      subtitle: '',
    },
  },
  {
    id: 'tech_foundation',
    label: 'Tech foundation',
    description: 'Infrastructure, tooling, or data work that enables future product decisions.',
    defaults: {
      criterion: 'foundation',
      criterion_secondary: null,
      effort: 'm',
      dep_note: '',
      subtitle: 'Enables future experiments and product decisions.',
    },
  },
  {
    id: 'partner_dependency',
    label: 'Partner / team dependency',
    description: 'Work triggered by an external partner or another internal team.',
    defaults: {
      criterion: 'dependency',
      criterion_secondary: 'execution_ready',
      effort: 's',
      dep_note: 'Triggered by: ',
      subtitle: '',
    },
  },
  {
    id: 'research_spike',
    label: 'Research spike',
    description: 'An investigation or prototype needed before committing to a full build.',
    defaults: {
      criterion: 'research',
      criterion_secondary: null,
      effort: 's',
      dep_note: 'Output: decision on whether to proceed and recommended approach.',
      subtitle: 'Time-boxed investigation to validate approach before committing.',
    },
  },
  {
    id: 'strategic_bet',
    label: 'Strategic bet',
    description: 'A large, multi-quarter initiative with high uncertainty.',
    defaults: {
      criterion: 'research',
      criterion_secondary: null,
      effort: 'xl',
      dep_note: 'Requires partner evaluation and technical spikes before commitment.',
      subtitle: '',
    },
  },
]

export const PARENT_COLORS = [
  '#5E6AD2', '#E5484D', '#F76B15', '#12A594', '#E93D82',
  '#0091FF', '#7C66DC', '#CD5EB0', '#30A46C', '#FFC53D',
]
