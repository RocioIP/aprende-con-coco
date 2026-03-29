<template>
  <div class="sessions-chart">
    <div class="sessions-chart__summary">
      <div>
        <strong class="sessions-chart__value">{{ currentSessionsLabel }}</strong>
        <p class="sessions-chart__message">{{ sessionsMessage }}</p>
      </div>

      <div class="sessions-chart__legend" aria-hidden="true">
        <span class="legend-item">
          <i class="legend-item__bar"></i>
          {{ t('progress.evolution.sessionsLegend') }}
        </span>
      </div>
    </div>

    <div v-if="points.length" class="sessions-chart__canvas">
      <svg viewBox="0 0 360 170" role="img" :aria-label="t('progress.evolution.sessionsDescription')">
        <g v-for="tick in yAxisTicks" :key="tick.value">
          <line
            x1="44"
            :y1="tick.y"
            x2="342"
            :y2="tick.y"
            class="sessions-chart__grid"
          />
          <text x="36" :y="tick.y + 4" class="sessions-chart__axis-label">{{ tick.label }}</text>
        </g>

        <line x1="18" y1="146" x2="342" y2="146" class="sessions-chart__baseline" />

        <g v-for="bar in bars" :key="bar.date">
          <rect
            :x="bar.x - 18"
            :y="146 - bar.height"
            width="36"
            :height="bar.height"
            rx="10"
            class="sessions-chart__bar"
          />
          <text
            :x="bar.x"
            :y="bar.height > 0 ? 146 - bar.height - 8 : 136"
            class="sessions-chart__bar-label"
            text-anchor="middle"
          >
            {{ bar.value }}
          </text>
        </g>
      </svg>
    </div>

    <div v-if="points.length" class="sessions-chart__days">
      <article v-for="point in points" :key="point.date" class="sessions-day">
        <span class="sessions-day__date">{{ formatShortDate(point.date) }}</span>
        <strong class="sessions-day__count">{{ point.sessionsCount }}</strong>
        <div class="sessions-day__meta">
          <span>{{ t('progress.labels.completed') }}: {{ point.completedSessions }}</span>
          <span>{{ t('progress.labels.audioReplays') }}: {{ point.totalAudioReplays }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProgressTimelinePoint } from '@/types/progress'

const props = defineProps<{
  points: ProgressTimelinePoint[]
}>()

const { t, locale } = useI18n()

const currentSessionsLabel = computed(() => {
  const latestPoint = [...props.points].reverse().find((point) => point.sessionsCount > 0)
  const count = latestPoint?.sessionsCount ?? 0
  return t('progress.evolution.currentSessions', { count })
})

const sessionsMessage = computed(() => {
  const totalSessions = props.points.reduce((sum, point) => sum + point.sessionsCount, 0)
  return t('progress.evolution.sessionsTotal', { count: totalSessions })
})

const maxSessions = computed(() => Math.max(...props.points.map((point) => point.sessionsCount), 0))

const yAxisTicks = computed(() => {
  const upperBound = Math.max(1, maxSessions.value)
  const midValue = Math.max(1, Math.ceil(upperBound / 2))

  return [
    { value: upperBound, label: String(upperBound) },
    { value: midValue, label: String(midValue) },
    { value: 0, label: '0' },
  ].map((tick) => ({
    ...tick,
    y: sessionY(tick.value, upperBound),
  }))
})

const bars = computed(() => {
  const upperBound = Math.max(1, maxSessions.value)

  return props.points.map((point, index) => ({
    date: point.date,
    value: point.sessionsCount,
    height: point.sessionsCount > 0 ? Math.max(10, Math.round((point.sessionsCount / upperBound) * 88)) : 0,
    x: pointX(index, props.points.length),
  }))
})

function pointX(index: number, total: number) {
  if (total <= 1) {
    return 180
  }

  const usableWidth = 284
  return 38 + (usableWidth / (total - 1)) * index
}

function sessionY(value: number, upperBound: number) {
  return 58 + (1 - value / upperBound) * 88
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}
</script>

<style scoped>
.sessions-chart {
  display: grid;
  gap: 1rem;
}

.sessions-chart__summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.sessions-chart__value {
  display: block;
  color: #1d3250;
  font-size: clamp(1.1rem, 1.7vw, 1.4rem);
}

.sessions-chart__message {
  margin: 0.35rem 0 0;
  color: #61738d;
  line-height: 1.45;
}

.sessions-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  color: #61738d;
  font-size: 0.92rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.legend-item__bar {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 0.3rem;
  background: rgba(37, 109, 255, 0.26);
}

.sessions-chart__canvas {
  padding: 0.8rem 0.7rem 0.25rem;
  border-radius: 1.3rem;
  background: linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(255, 255, 255, 0.98));
}

.sessions-chart__canvas svg {
  display: block;
  width: 100%;
  height: auto;
}

.sessions-chart__baseline {
  stroke: rgba(53, 79, 122, 0.12);
  stroke-width: 2;
}

.sessions-chart__grid {
  stroke: rgba(53, 79, 122, 0.12);
  stroke-width: 1.5;
  stroke-dasharray: 4 6;
}

.sessions-chart__axis-label {
  fill: #7d8ea6;
  font-size: 11px;
  font-weight: 700;
}

.sessions-chart__bar {
  fill: rgba(37, 109, 255, 0.26);
}

.sessions-chart__bar-label {
  fill: #2558c6;
  font-size: 12px;
  font-weight: 800;
}

.sessions-chart__days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.8rem;
}

.sessions-day {
  padding: 0.85rem 0.9rem;
  border-radius: 1rem;
  background: #f8fbff;
}

.sessions-day__date {
  display: block;
  color: #6a7c95;
  font-size: 0.9rem;
}

.sessions-day__count {
  display: block;
  margin-top: 0.35rem;
  color: #1d3250;
  font-size: 1.08rem;
}

.sessions-day__meta {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.35rem;
  color: #607089;
  font-size: 0.88rem;
}

@media (max-width: 640px) {
  .sessions-chart__summary {
    flex-direction: column;
  }
}
</style>
