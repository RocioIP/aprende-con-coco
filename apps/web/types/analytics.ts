export type ActivitySessionStatus = 'started' | 'completed' | 'abandoned' | 'interrupted'

export interface ActivitySessionRecord {
  id: number
}

export interface ActivitySessionStartPayload {
  activityCode: string
  childId?: number
  deviceType?: string
  difficultyStart?: number | null
  locale?: string
  metadata?: Record<string, unknown>
}

export interface ActivityResponsePayload {
  answer?: Record<string, unknown> | null
  attemptNumber?: number
  audioReplayCount?: number
  expected?: Record<string, unknown> | null
  helpUsed?: boolean
  hintsUsed?: number
  isCorrect: boolean
  metadata?: Record<string, unknown>
  prompt?: Record<string, unknown> | null
  promptType?: string
  reactionMs?: number | null
  sequence: number
}

export interface ActivityEventPayload {
  occurredAt?: string
  payload?: Record<string, unknown>
  responseId?: number
  type: string
}

export interface ActivitySessionFinishPayload {
  completionRate?: number
  difficultyEnd?: number | null
  metadata?: Record<string, unknown>
  score?: number
  status: Exclude<ActivitySessionStatus, 'started'>
}
