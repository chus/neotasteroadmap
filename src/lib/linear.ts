const LINEAR_API_URL = 'https://api.linear.app/graphql'

export class LinearAPIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'LinearAPIError'
    this.status = status
  }
}

export function isLinearConfigured(): boolean {
  return !!process.env.LINEAR_API_KEY
}

async function linearFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    throw new LinearAPIError('LINEAR_API_KEY is not set', 401)
  }

  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new LinearAPIError(`Linear API error: ${res.status} — ${text}`, res.status)
  }

  const json = await res.json()

  if (json.errors?.length) {
    throw new LinearAPIError(
      `Linear GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`,
      400
    )
  }

  return json.data as T
}

// ─── Column ↔ Linear state mapping ───

export const COLUMN_TO_LINEAR_STATE: Record<string, string> = {
  now: 'started',
  next: 'planned',
  later: 'planned',
  parked: 'cancelled',
}

export const LINEAR_STATE_TO_COLUMN: Record<string, string> = {
  started: 'now',
  inProgress: 'now',
  planned: 'next',
  backlog: 'later',
  cancelled: 'parked',
  completed: 'parked',
}

// ─── Team (cached) ───

let cachedTeam: { id: string; name: string; key: string } | null = null

export async function getLinearTeam(): Promise<{ id: string; name: string; key: string }> {
  if (cachedTeam) return cachedTeam

  const teamName = process.env.LINEAR_TEAM_NAME || 'PDE'

  const data = await linearFetch<{
    teams: { nodes: { id: string; name: string; key: string }[] }
  }>(`query {
    teams {
      nodes {
        id
        name
        key
      }
    }
  }`)

  const team = data.teams.nodes.find((t) => t.name === teamName)
  if (!team) {
    throw new LinearAPIError(`Team "${teamName}" not found in Linear workspace`, 404)
  }

  cachedTeam = team
  return team
}

// ─── Projects ───

export interface LinearProject {
  id: string
  name: string
  state: string
  url: string
  targetDate: string | null
  description: string | null
  updatedAt?: string
}

export async function getLinearProjectStates(teamId: string): Promise<LinearProject[]> {
  const data = await linearFetch<{
    team: { projects: { nodes: LinearProject[] } }
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        projects {
          nodes {
            id
            name
            state
            url
            targetDate
            description
          }
        }
      }
    }`,
    { teamId }
  )

  return data.team.projects.nodes
}

export async function createLinearProject(input: {
  name: string
  description: string
  teamIds: string[]
  state: string
  targetDate?: string
}): Promise<{ id: string; name: string; url: string; state: string }> {
  const data = await linearFetch<{
    projectCreate: {
      success: boolean
      project: { id: string; name: string; url: string; state: string }
    }
  }>(
    `mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project {
          id
          name
          url
          state
        }
      }
    }`,
    { input }
  )

  if (!data.projectCreate.success) {
    throw new LinearAPIError('Failed to create Linear project', 500)
  }

  return data.projectCreate.project
}

export async function updateLinearProject(
  id: string,
  input: {
    name?: string
    description?: string
    state?: string
    targetDate?: string | null
  }
): Promise<{ id: string; state: string; targetDate: string | null; name: string; url: string }> {
  const data = await linearFetch<{
    projectUpdate: {
      success: boolean
      project: { id: string; state: string; targetDate: string | null; name: string; url: string }
    }
  }>(
    `mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
      projectUpdate(id: $id, input: $input) {
        success
        project {
          id
          state
          targetDate
          name
          url
        }
      }
    }`,
    { id, input }
  )

  if (!data.projectUpdate.success) {
    throw new LinearAPIError('Failed to update Linear project', 500)
  }

  return data.projectUpdate.project
}

export async function getLinearProject(id: string): Promise<LinearProject & { updatedAt: string }> {
  const data = await linearFetch<{
    project: LinearProject & { updatedAt: string }
  }>(
    `query($id: String!) {
      project(id: $id) {
        id
        name
        state
        url
        targetDate
        description
        updatedAt
      }
    }`,
    { id }
  )

  return data.project
}
