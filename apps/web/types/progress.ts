export type ProgressActivityType = 'game' | 'story' | 'blackboard'
export type ProgressSessionStatus = 'started' | 'completed' | 'abandoned' | 'interrupted'
export type ProgressRecommendationKind =
  | 'next_activity'
  | 'difficulty_adjustment'
  | 'caregiver_tip'
  | 'schedule_tip'
  | 'engagement_support'

export interface ChildCaregiverUserSummary {
  id: number
  email: string
  displayName: string | null
  role: string
}

export interface ChildCaregiverSummary {
  id: number
  relationship: string
  accessLevel: string
  isPrimary: boolean
  user: ChildCaregiverUserSummary
}

export interface ChildSummary {
  id: number
  name: string
  birthdate: string | null
  caregivers: ChildCaregiverSummary[]
  _count: {
    sessions: number
    recommendations: number
  }
}

export interface DashboardActivityRef {
  code: string
  name: string
  type: ProgressActivityType
}

export interface DashboardFavoriteActivity {
  code: string
  name: string
  sessions: number
  preferenceScore: number
}

export interface ChildDashboardOverview {
  totalSessions: number
  totalResponses: number
  accuracyRate: number | null
  favoriteActivity: DashboardFavoriteActivity | null
}

export interface ChildDashboardDailyStat {
  id: number
  statDate: string
  sessionsCount: number
  completedSessions: number
  abandonedSessions: number
  totalResponses: number
  correctResponses: number
  wrongResponses: number
  totalHelpUsed: number
  totalAudioReplays: number
  avgReactionMs: number | null
  engagementScore: number | null
  preferenceScore: number | null
  activity: DashboardActivityRef
}

export interface ChildDashboardSkillSnapshot {
  id: number
  snapshotDate: string
  attemptsCount: number
  correctCount: number
  accuracyRate: number | null
  avgReactionMs: number | null
  confidenceScore: number | null
  masteryScore: number | null
  skill: {
    code: string
    name: string
    category: string
  }
}

export interface ChildDashboardSession {
  id: number
  locale: string
  status: ProgressSessionStatus
  startedAt: string
  endedAt: string | null
  durationMs: number | null
  completionRate: number | null
  score: number | null
  totalResponses: number
  correctResponses: number
  wrongResponses: number
  helpCount: number
  audioReplayCount: number
  activity: DashboardActivityRef
}

export interface ChildDashboardRecommendation {
  id: number
  kind: ProgressRecommendationKind
  priority: number
  title: string
  summary: string
  source: string
  activity: DashboardActivityRef | null
}

export interface ProgressTimelinePoint {
  accuracyRate: number | null
  avgReactionMs: number | null
  completedSessions: number
  date: string
  sessionsCount: number
  totalAudioReplays: number
  totalHelpUsed: number
  totalResponses: number
}

export interface ChildDashboard {
  child: Omit<ChildSummary, '_count'> & {
    createdAt?: string
    updatedAt?: string
  }
  overview: ChildDashboardOverview
  dailyStats: ChildDashboardDailyStat[]
  skillSnapshots: ChildDashboardSkillSnapshot[]
  recentSessions: ChildDashboardSession[]
  recommendations: ChildDashboardRecommendation[]
}
