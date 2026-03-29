<template>
  <section class="progress-screen">
    <div class="progress-screen__hero">
      <div class="progress-screen__copy">
        <span class="progress-screen__eyebrow">{{ t('progress.eyebrow') }}</span>
        <h1 class="progress-screen__title">{{ t('progress.title') }}</h1>
        <p class="progress-screen__description">{{ t('progress.description') }}</p>
      </div>
    </div>

    <div v-if="isLoadingDashboard && !dashboard" class="progress-screen__state">
      {{ t('progress.loading') }}
    </div>

    <div
      v-else-if="errorMessage && !dashboard"
      class="progress-screen__state progress-screen__state--error"
    >
      <p>{{ errorMessage }}</p>
      <button type="button" class="progress-screen__retry" @click="retry">
        {{ t('progress.retry') }}
      </button>
    </div>

    <div v-else-if="dashboard" class="progress-screen__content">
      <section class="progress-screen__summary">
        <article class="progress-screen__child-card">
          <div class="progress-screen__child-head">
            <div>
              <p class="progress-screen__child-kicker">{{ t('progress.child.activeProfile') }}</p>
              <h2 class="progress-screen__child-name">{{ dashboard.child.name }}</h2>
            </div>
            <span class="progress-screen__child-chip">
              {{ childAgeLabel }}
            </span>
          </div>

          <div class="progress-screen__caregivers">
            <div>
              <span class="progress-screen__label">{{ t('progress.child.primaryCaregiver') }}</span>
              <strong>{{ primaryCaregiverName }}</strong>
            </div>
            <div>
              <span class="progress-screen__label">{{ t('progress.metrics.favorite') }}</span>
              <strong>{{ favoriteActivityLabel }}</strong>
            </div>
          </div>
        </article>

        <div class="progress-screen__metrics">
          <ProgressMetricCard
            :label="t('progress.metrics.sessions')"
            :value="dashboard.overview.totalSessions"
            :hint="selectedSessionCountLabel"
            tone="sun"
          />
          <ProgressMetricCard
            :label="t('progress.metrics.responses')"
            :value="dashboard.overview.totalResponses"
            :hint="`${t('progress.labels.audioReplays')}: ${totalAudioReplays}`"
            tone="sky"
          />
          <ProgressMetricCard
            :label="t('progress.metrics.accuracy')"
            :value="formatPercent(dashboard.overview.accuracyRate)"
            :hint="`${t('progress.labels.helps')}: ${totalHelpsUsed}`"
            tone="mint"
          />
          <ProgressMetricCard
            :label="t('progress.metrics.favorite')"
            :value="favoriteActivityLabel"
            :hint="favoriteActivityHint"
            tone="rose"
          />
        </div>
      </section>

      <section class="progress-screen__grid">
        <article class="progress-panel progress-panel--full">
          <div class="progress-panel__head">
            <div>
              <h2>{{ t('progress.sections.evolution') }}</h2>
              <p class="progress-panel__description">{{ t('progress.evolution.description') }}</p>
            </div>
          </div>

          <div v-if="timelinePoints.length" class="progress-panel__charts">
            <ProgressTrendChart :points="timelinePoints" />
            <ProgressSessionsChart :points="timelinePoints" />
          </div>

          <p v-else class="progress-panel__empty">
            {{ t('progress.noEvolution') }}
          </p>
        </article>

        <article class="progress-panel">
          <div class="progress-panel__head">
            <h2>{{ t('progress.sections.activities') }}</h2>
          </div>

          <div v-if="activityHighlights.length" class="activity-list">
            <article
              v-for="activity in activityHighlights"
              :key="activity.code"
              class="activity-card"
            >
              <div class="activity-card__head">
                <div>
                  <strong>{{ activity.name }}</strong>
                  <span>{{ t('progress.child.sessionCount', { count: activity.sessions }) }}</span>
                </div>
                <span class="activity-card__type">{{ formatActivityType(activity.type) }}</span>
              </div>

              <div class="activity-card__track" aria-hidden="true">
                <span :style="{ width: `${activity.barWidth}%` }"></span>
              </div>

              <div class="activity-card__stats">
                <span>{{ t('progress.labels.accuracy') }}: {{ formatPercent(activity.accuracyRate) }}</span>
                <span>{{ t('progress.labels.preference') }}: {{ formatDecimal(activity.preferenceScore) }}</span>
              </div>
            </article>
          </div>

          <p v-else class="progress-panel__empty">
            {{ t('progress.noActivities') }}
          </p>
        </article>

        <article class="progress-panel">
          <div class="progress-panel__head">
            <h2>{{ t('progress.sections.sessions') }}</h2>
          </div>

          <ul v-if="recentSessions.length" class="session-list">
            <li v-for="session in recentSessions" :key="session.id" class="session-item">
              <div class="session-item__head">
                <div>
                  <strong>{{ session.activity.name }}</strong>
                  <span>{{ formatDateTime(session.startedAt) }}</span>
                </div>
                <span class="session-item__status" :class="`status-${session.status}`">
                  {{ t(`progress.status.${session.status}`) }}
                </span>
              </div>

              <div class="session-item__stats">
                <span>{{ t('progress.labels.accuracy') }}: {{ formatPercent(sessionAccuracy(session)) }}</span>
                <span>{{ t('progress.labels.duration') }}: {{ formatDuration(session.durationMs) }}</span>
                <span>{{ t('progress.labels.audioReplays') }}: {{ session.audioReplayCount }}</span>
              </div>
            </li>
          </ul>

          <p v-else class="progress-panel__empty">
            {{ t('progress.noSessions') }}
          </p>
        </article>

        <article class="progress-panel">
          <div class="progress-panel__head">
            <h2>{{ t('progress.sections.skills') }}</h2>
          </div>

          <div v-if="latestSkillSnapshots.length" class="skill-list">
            <article
              v-for="snapshot in latestSkillSnapshots"
              :key="snapshot.skill.code"
              class="skill-card"
            >
              <div class="skill-card__head">
                <div>
                  <strong>{{ snapshot.skill.name }}</strong>
                  <span>{{ formatShortDate(snapshot.snapshotDate) }}</span>
                </div>
                <span class="skill-card__tag">{{ formatSkillCategory(snapshot.skill.category) }}</span>
              </div>

              <div class="skill-card__stats">
                <span>{{ t('progress.labels.accuracy') }}: {{ formatPercent(snapshot.accuracyRate) }}</span>
                <span>{{ t('progress.labels.mastery') }}: {{ formatPercent(snapshot.masteryScore) }}</span>
                <span>{{ t('progress.labels.avgReaction') }}: {{ formatDuration(snapshot.avgReactionMs) }}</span>
              </div>

              <div class="skill-card__track" aria-hidden="true">
                <span :style="{ width: `${masteryWidth(snapshot)}%` }"></span>
              </div>
            </article>
          </div>

          <p v-else class="progress-panel__empty">
            {{ t('progress.noSkills') }}
          </p>
        </article>

        <article class="progress-panel progress-panel--full">
          <div class="progress-panel__head">
            <h2>{{ t('progress.sections.recommendations') }}</h2>
          </div>

          <div v-if="dashboard.recommendations.length" class="recommendation-grid">
            <article
              v-for="recommendation in dashboard.recommendations"
              :key="recommendation.id"
              class="recommendation-card"
            >
              <div class="recommendation-card__head">
                <span class="recommendation-card__kind">
                  {{ t(`progress.recommendationKind.${recommendation.kind}`) }}
                </span>
                <span class="recommendation-card__priority">P{{ recommendation.priority }}</span>
              </div>

              <h3 class="recommendation-card__title">{{ recommendation.title }}</h3>
              <p class="recommendation-card__summary">{{ recommendation.summary }}</p>

              <div class="recommendation-card__meta">
                <span v-if="recommendation.activity">
                  {{ t('progress.labels.recommendationFor') }}: {{ recommendation.activity.name }}
                </span>
                <span>{{ t('progress.labels.source') }}: {{ formatSource(recommendation.source) }}</span>
              </div>
            </article>
          </div>

          <p v-else class="progress-panel__empty">
            {{ t('progress.noRecommendations') }}
          </p>
        </article>
      </section>
    </div>

    <div v-else class="progress-screen__state">
      {{ t('progress.empty') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ProgressMetricCard from '@/components/atoms/ProgressMetricCard.vue'
import ProgressSessionsChart from '@/components/molecules/ProgressSessionsChart.vue'
import ProgressTrendChart from '@/components/molecules/ProgressTrendChart.vue'
import { useChildDashboard } from '@/composables/useChildDashboard'
import type {
  ChildDashboardDailyStat,
  ChildDashboardSession,
  ChildDashboardSkillSnapshot,
  ProgressTimelinePoint,
} from '@/types/progress'

const { t, locale } = useI18n()
const {
  auth,
  dashboard,
  errorMessage,
  loadDashboard,
  isLoadingDashboard,
} = useChildDashboard()

const primaryCaregiverName = computed(() => {
  const caregivers = dashboard.value?.child.caregivers ?? []
  const primaryCaregiver = caregivers.find((caregiver) => caregiver.isPrimary) ?? caregivers[0]

  return (
    primaryCaregiver?.user.displayName ??
    primaryCaregiver?.user.email ??
    t('progress.child.noCaregiver')
  )
})

const childAgeLabel = computed(() => {
  const birthdate = dashboard.value?.child.birthdate
  if (!birthdate) {
    return t('progress.child.noAge')
  }

  const now = new Date()
  const birth = new Date(birthdate)
  let years = now.getFullYear() - birth.getFullYear()
  const hasNotHadBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())

  if (hasNotHadBirthday) {
    years -= 1
  }

  return t('progress.child.age', { count: Math.max(0, years) })
})

const selectedSessionCountLabel = computed(() => {
  const sessionCount = dashboard.value?.overview.totalSessions ?? 0

  return t('progress.child.sessionCount', { count: sessionCount })
})

const favoriteActivityLabel = computed(() => {
  return dashboard.value?.overview.favoriteActivity?.name ?? t('progress.labels.noFavorite')
})

const favoriteActivityHint = computed(() => {
  const favoriteActivity = dashboard.value?.overview.favoriteActivity
  if (!favoriteActivity) {
    return ''
  }

  return t('progress.child.sessionCount', { count: favoriteActivity.sessions })
})

const totalAudioReplays = computed(() => {
  return (dashboard.value?.dailyStats ?? []).reduce((sum, stat) => sum + stat.totalAudioReplays, 0)
})

const totalHelpsUsed = computed(() => {
  return (dashboard.value?.dailyStats ?? []).reduce((sum, stat) => sum + stat.totalHelpUsed, 0)
})

const timelinePoints = computed<ProgressTimelinePoint[]>(() => {
  const grouped = new Map<
    string,
    {
      date: string
      sessionsCount: number
      completedSessions: number
      totalResponses: number
      correctResponses: number
      totalHelpUsed: number
      totalAudioReplays: number
      reactionMsSum: number
      reactionSamples: number
    }
  >()

  for (const stat of dashboard.value?.dailyStats ?? []) {
    const current = grouped.get(stat.statDate) ?? {
      date: stat.statDate,
      sessionsCount: 0,
      completedSessions: 0,
      totalResponses: 0,
      correctResponses: 0,
      totalHelpUsed: 0,
      totalAudioReplays: 0,
      reactionMsSum: 0,
      reactionSamples: 0,
    }

    current.sessionsCount += stat.sessionsCount
    current.completedSessions += stat.completedSessions
    current.totalResponses += stat.totalResponses
    current.correctResponses += stat.correctResponses
    current.totalHelpUsed += stat.totalHelpUsed
    current.totalAudioReplays += stat.totalAudioReplays

    if (typeof stat.avgReactionMs === 'number') {
      current.reactionMsSum += stat.avgReactionMs * Math.max(stat.sessionsCount, 1)
      current.reactionSamples += Math.max(stat.sessionsCount, 1)
    }

    grouped.set(stat.statDate, current)
  }

  return [...grouped.values()]
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(-7)
    .map((point) => ({
      date: point.date,
      sessionsCount: point.sessionsCount,
      completedSessions: point.completedSessions,
      totalResponses: point.totalResponses,
      totalHelpUsed: point.totalHelpUsed,
      totalAudioReplays: point.totalAudioReplays,
      accuracyRate:
        point.totalResponses > 0 ? point.correctResponses / point.totalResponses : null,
      avgReactionMs:
        point.reactionSamples > 0 ? Math.round(point.reactionMsSum / point.reactionSamples) : null,
    }))
})

const activityHighlights = computed(() => {
  const grouped = new Map<
    string,
    {
      code: string
      name: string
      type: ChildDashboardDailyStat['activity']['type']
      sessions: number
      totalResponses: number
      correctResponses: number
      preferenceScore: number
    }
  >()

  for (const stat of dashboard.value?.dailyStats ?? []) {
    const current = grouped.get(stat.activity.code) ?? {
      code: stat.activity.code,
      name: stat.activity.name,
      type: stat.activity.type,
      sessions: 0,
      totalResponses: 0,
      correctResponses: 0,
      preferenceScore: 0,
    }

    current.sessions += stat.sessionsCount
    current.totalResponses += stat.totalResponses
    current.correctResponses += stat.correctResponses
    current.preferenceScore += stat.preferenceScore ?? 0
    grouped.set(stat.activity.code, current)
  }

  const list = [...grouped.values()]
    .sort(
      (left, right) =>
        right.preferenceScore + right.sessions - (left.preferenceScore + left.sessions)
    )
    .slice(0, 4)

  const maxSessions = Math.max(...list.map((activity) => activity.sessions), 1)

  return list.map((activity) => ({
    ...activity,
    accuracyRate:
      activity.totalResponses > 0 ? activity.correctResponses / activity.totalResponses : null,
    barWidth: Math.max(18, Math.round((activity.sessions / maxSessions) * 100)),
  }))
})

const latestSkillSnapshots = computed(() => {
  const seenSkills = new Set<string>()
  const snapshots: ChildDashboardSkillSnapshot[] = []

  for (const snapshot of dashboard.value?.skillSnapshots ?? []) {
    if (seenSkills.has(snapshot.skill.code)) {
      continue
    }

    seenSkills.add(snapshot.skill.code)
    snapshots.push(snapshot)
  }

  return snapshots.slice(0, 4)
})

const recentSessions = computed(() => {
  return (dashboard.value?.recentSessions ?? []).slice(0, 5)
})

function formatPercent(value: number | null) {
  if (typeof value !== 'number') {
    return '-'
  }

  return `${Math.round(value * 100)}%`
}

function formatDecimal(value: number | null) {
  if (typeof value !== 'number') {
    return '-'
  }

  return new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDuration(durationMs: number | null) {
  if (typeof durationMs !== 'number' || durationMs <= 0) {
    return '-'
  }

  if (durationMs < 60_000) {
    return `${Math.max(1, Math.round(durationMs / 1_000))} ${t('progress.units.secondsShort')}`
  }

  return `${Math.max(1, Math.round(durationMs / 60_000))} ${t('progress.units.minutesShort')}`
}

function formatActivityType(type: ChildDashboardDailyStat['activity']['type']) {
  return t(`progress.activityType.${type}`)
}

function formatSkillCategory(category: ChildDashboardSkillSnapshot['skill']['category']) {
  return t(`progress.skillCategory.${category}`)
}

function formatSource(source: string) {
  if (source === 'rules') {
    return t('progress.source.rules')
  }

  return source
}

function sessionAccuracy(session: ChildDashboardSession) {
  if (session.totalResponses <= 0) {
    return null
  }

  return session.correctResponses / session.totalResponses
}

function masteryWidth(snapshot: ChildDashboardSkillSnapshot) {
  if (typeof snapshot.masteryScore === 'number') {
    return Math.max(16, Math.round(snapshot.masteryScore * 100))
  }

  if (typeof snapshot.accuracyRate === 'number') {
    return Math.max(16, Math.round(snapshot.accuracyRate * 100))
  }

  return 16
}

async function retry() {
  await auth.ensureSession(true)
  await loadDashboard()
}

onMounted(() => {
  void loadDashboard()
})
</script>

<style scoped>
.progress-screen {
  min-height: calc(100dvh - 6rem);
  padding: 1.6rem 1rem 2rem;
  background:
    radial-gradient(circle at top left, rgba(255, 241, 219, 0.8), transparent 26%),
    radial-gradient(circle at top right, rgba(218, 235, 255, 0.8), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f9ff 100%);
}

.progress-screen__hero,
.progress-screen__content,
.child-picker,
.progress-screen__state {
  width: min(100%, 72rem);
  margin-inline: auto;
}

.progress-screen__hero {
  margin-bottom: 1.25rem;
}

.progress-screen__eyebrow {
  display: inline-flex;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  color: #607089;
  font-size: 0.95rem;
  font-weight: 700;
}

.progress-screen__title {
  margin: 0.9rem 0 0;
  color: #1d3250;
  font-size: clamp(2rem, 2.8vw, 3.1rem);
  line-height: 1.08;
}

.progress-screen__description {
  max-width: 42rem;
  margin: 0.75rem 0 0;
  color: #5f7089;
  font-size: 1.05rem;
  line-height: 1.55;
}

.progress-screen__state {
  margin-top: 1rem;
  padding: 1.2rem 1.4rem;
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 34px rgba(28, 50, 80, 0.08);
  color: #1d3250;
}

.progress-screen__state--error {
  display: grid;
  gap: 0.8rem;
}

.progress-screen__retry {
  justify-self: start;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 999px;
  background: #256dff;
  color: #ffffff;
  font-weight: 700;
}

.progress-screen__content {
  margin-top: 1.25rem;
}

.progress-screen__summary {
  display: grid;
  grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
  gap: 1rem;
}

.progress-screen__child-card {
  padding: 1.3rem;
  border-radius: 1.6rem;
  background: linear-gradient(160deg, #ffffff 0%, #fff8ec 100%);
  box-shadow: 0 18px 38px rgba(28, 50, 80, 0.1);
}

.progress-screen__child-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.progress-screen__child-kicker,
.progress-screen__label {
  display: block;
  color: #6f7f96;
  font-size: 0.9rem;
}

.progress-screen__child-name {
  margin: 0.35rem 0 0;
  color: #1d3250;
  font-size: 1.9rem;
}

.progress-screen__child-chip {
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 183, 27, 0.14);
  color: #995900;
  font-size: 0.92rem;
  font-weight: 700;
  white-space: nowrap;
}

.progress-screen__caregivers {
  display: grid;
  gap: 1rem;
  margin-top: 1.25rem;
}

.progress-screen__caregivers strong {
  display: block;
  margin-top: 0.2rem;
  color: #1d3250;
  font-size: 1.05rem;
}

.progress-screen__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.progress-screen__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.progress-panel {
  padding: 1.25rem;
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 38px rgba(28, 50, 80, 0.08);
}

.progress-panel--full {
  grid-column: 1 / -1;
}

.progress-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-panel__head h2 {
  margin: 0;
  color: #1d3250;
  font-size: 1.22rem;
}

.progress-panel__description {
  margin: 0.25rem 0 0;
  color: #657791;
  font-size: 0.94rem;
  line-height: 1.45;
}

.progress-panel__charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.progress-panel__empty {
  margin: 0;
  color: #6b7d96;
  line-height: 1.5;
}

.activity-list,
.skill-list,
.recommendation-grid {
  display: grid;
  gap: 0.9rem;
}

.activity-card,
.skill-card,
.recommendation-card,
.session-item {
  padding: 1rem;
  border-radius: 1.2rem;
  background: #f8fbff;
}

.activity-card__head,
.skill-card__head,
.session-item__head,
.recommendation-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.activity-card__head strong,
.skill-card__head strong,
.session-item__head strong,
.recommendation-card__title {
  color: #1d3250;
}

.activity-card__head span,
.skill-card__head span,
.session-item__head span {
  display: block;
  margin-top: 0.2rem;
  color: #6c7d95;
  font-size: 0.9rem;
}

.activity-card__type,
.skill-card__tag,
.session-item__status,
.recommendation-card__kind,
.recommendation-card__priority {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.activity-card__type,
.skill-card__tag {
  background: rgba(37, 109, 255, 0.08);
  color: #2559c8;
}

.activity-card__track,
.skill-card__track {
  height: 0.65rem;
  margin-top: 0.8rem;
  border-radius: 999px;
  background: rgba(39, 93, 194, 0.1);
  overflow: hidden;
}

.activity-card__track span,
.skill-card__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffb71b 0%, #ff7b54 100%);
}

.skill-card__track span {
  background: linear-gradient(90deg, #33c27f 0%, #23a5a7 100%);
}

.activity-card__stats,
.skill-card__stats,
.session-item__stats,
.recommendation-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  margin-top: 0.8rem;
  color: #53667f;
  font-size: 0.92rem;
}

.session-list {
  display: grid;
  gap: 0.85rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.status-started {
  background: rgba(37, 109, 255, 0.1);
  color: #2559c8;
}

.status-completed {
  background: rgba(51, 194, 127, 0.12);
  color: #17895a;
}

.status-abandoned,
.status-interrupted {
  background: rgba(255, 122, 89, 0.13);
  color: #c4552e;
}

.recommendation-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.recommendation-card {
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: inset 0 0 0 1px rgba(37, 109, 255, 0.06);
}

.recommendation-card__kind {
  background: rgba(37, 109, 255, 0.08);
  color: #2559c8;
}

.recommendation-card__priority {
  background: rgba(255, 183, 27, 0.14);
  color: #995900;
}

.recommendation-card__title {
  margin: 0.9rem 0 0;
  font-size: 1.1rem;
}

.recommendation-card__summary {
  margin: 0.45rem 0 0;
  color: #5e6f88;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .progress-screen__summary,
  .progress-screen__grid,
  .recommendation-grid,
  .progress-panel__charts {
    grid-template-columns: 1fr;
  }

  .progress-screen__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .progress-screen {
    padding-inline: 0.8rem;
  }

  .progress-screen__metrics {
    grid-template-columns: 1fr;
  }

  .progress-screen__child-head,
  .activity-card__head,
  .skill-card__head,
  .session-item__head,
  .recommendation-card__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
