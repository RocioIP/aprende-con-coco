<template>
  <div class="trend-chart">
    <div class="trend-chart__summary">
      <div>
        <strong class="trend-chart__value">{{ currentAccuracyLabel }}</strong>
        <p class="trend-chart__message">{{ trendMessage }}</p>
      </div>

      <div class="trend-chart__legend" aria-hidden="true">
        <span class="legend-item">
          <i class="legend-item__line"></i>
          {{ t('progress.evolution.accuracyLegend') }}
        </span>
      </div>
    </div>

    <div v-if="points.length" class="trend-chart__canvas">
      <svg viewBox="0 0 360 170" role="img" :aria-label="t('progress.evolution.description')">
        <g v-for="tick in yAxisTicks" :key="tick.value">
          <line
            x1="44"
            :y1="tick.y"
            x2="342"
            :y2="tick.y"
            class="trend-chart__grid"
          />
          <text x="36" :y="tick.y + 4" class="trend-chart__axis-label">{{ tick.label }}</text>
        </g>

        <line x1="18" y1="146" x2="342" y2="146" class="trend-chart__baseline" />

        <polygon
          v-if="lineAreaPoints"
          :points="lineAreaPoints"
          class="trend-chart__area"
        />

        <polyline
          v-if="linePoints"
          :points="linePoints"
          class="trend-chart__line"
        />

        <g v-for="point in lineDots" :key="point.date">
          <text
            :x="point.x"
            :y="Math.max(22, point.y - 12)"
            class="trend-chart__point-label"
            text-anchor="middle"
          >
            {{ point.label }}
          </text>
          <circle
            :cx="point.x"
            :cy="point.y"
            r="5.5"
            class="trend-chart__dot"
          />
        </g>
      </svg>
    </div>

    <div v-if="points.length" class="trend-chart__days">
      <article v-for="point in points" :key="point.date" class="trend-day">
        <span class="trend-day__date">{{ formatShortDate(point.date) }}</span>
        <strong class="trend-day__accuracy">{{ formatPercent(point.accuracyRate) }}</strong>
        <div class="trend-day__meta">
          <span>{{ point.sessionsCount }} {{ t('progress.metrics.sessions').toLowerCase() }}</span>
          <span>{{ formatDuration(point.avgReactionMs) }}</span>
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

const yAxisTicks = [
  { value: 1, label: '100%' },
  { value: 0.75, label: '75%' },
  { value: 0.5, label: '50%' },
  { value: 0.25, label: '25%' },
  { value: 0, label: '0%' },
].map((tick) => ({
  ...tick,
  y: accuracyY(tick.value),
}))

const currentAccuracyLabel = computed(() => {
  const latestPoint = [...props.points].reverse().find((point) => typeof point.accuracyRate === 'number')
  return `${t('progress.evolution.todayAccuracy')}: ${formatPercent(latestPoint?.accuracyRate ?? null)}`
})

const trendMessage = computed(() => {
  const validPoints = props.points.filter((point) => typeof point.accuracyRate === 'number')
  if (validPoints.length < 2) {
    return t('progress.evolution.steady')
  }

  const firstAccuracy = validPoints[0].accuracyRate ?? 0
  const lastAccuracy = validPoints[validPoints.length - 1].accuracyRate ?? 0
  const delta = lastAccuracy - firstAccuracy

  if (delta >= 0.08) {
    return t('progress.evolution.improving')
  }

  if (delta <= -0.08) {
    return t('progress.evolution.needsSupport')
  }

  return t('progress.evolution.steady')
})

const lineDots = computed(() => {
  return props.points
    .map((point, index) => {
      if (typeof point.accuracyRate !== 'number') {
        return null
      }

      return {
        date: point.date,
        x: pointX(index, props.points.length),
        y: accuracyY(point.accuracyRate),
        label: formatPercent(point.accuracyRate),
      }
    })
    .filter((point): point is { date: string; x: number; y: number; label: string } => point !== null)
})

const linePoints = computed(() => {
  if (!lineDots.value.length) {
    return ''
  }

  return lineDots.value.map((point) => `${point.x},${point.y}`).join(' ')
})

const lineAreaPoints = computed(() => {
  if (!lineDots.value.length) {
    return ''
  }

  const firstPoint = lineDots.value[0]
  const lastPoint = lineDots.value[lineDots.value.length - 1]

  return [
    `${firstPoint.x},146`,
    ...lineDots.value.map((point) => `${point.x},${point.y}`),
    `${lastPoint.x},146`,
  ].join(' ')
})

function pointX(index: number, total: number) {
  if (total <= 1) {
    return 180
  }

  const usableWidth = 296
  return 32 + (usableWidth / (total - 1)) * index
}

function accuracyY(accuracyRate: number) {
  return 32 + (1 - accuracyRate) * 88
}

function formatPercent(value: number | null) {
  if (typeof value !== 'number') {
    return '-'
  }

  return `${Math.round(value * 100)}%`
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}
</script>

<style scoped>
.trend-chart {
  display: grid;
  gap: 1rem;
}

.trend-chart__summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.trend-chart__value {
  display: block;
  color: #1d3250;
  font-size: clamp(1.1rem, 1.7vw, 1.4rem);
}

.trend-chart__message {
  margin: 0.35rem 0 0;
  color: #61738d;
  line-height: 1.45;
}

.trend-chart__legend {
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

.legend-item__line,
.legend-item__bar {
  display: inline-block;
  flex: 0 0 auto;
}

.legend-item__line {
  width: 1.4rem;
  height: 0.2rem;
  border-radius: 999px;
  background: #ff8b3d;
}

.trend-chart__canvas {
  padding: 0.8rem 0.7rem 0.25rem;
  border-radius: 1.3rem;
  background: linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(255, 255, 255, 0.98));
}

.trend-chart__canvas svg {
  display: block;
  width: 100%;
  height: auto;
}

.trend-chart__baseline {
  stroke: rgba(53, 79, 122, 0.12);
  stroke-width: 2;
}

.trend-chart__grid {
  stroke: rgba(53, 79, 122, 0.12);
  stroke-width: 1.5;
  stroke-dasharray: 4 6;
}

.trend-chart__axis-label {
  fill: #7d8ea6;
  font-size: 11px;
  font-weight: 700;
}

.trend-chart__area {
  fill: rgba(255, 139, 61, 0.14);
}

.trend-chart__line {
  fill: none;
  stroke: #ff8b3d;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-chart__point-label {
  fill: #ad5a20;
  font-size: 11px;
  font-weight: 800;
}

.trend-chart__dot {
  fill: #ffffff;
  stroke: #ff8b3d;
  stroke-width: 4;
}

.trend-chart__days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.8rem;
}

.trend-day {
  padding: 0.85rem 0.9rem;
  border-radius: 1rem;
  background: #f8fbff;
}

.trend-day__date {
  display: block;
  color: #6a7c95;
  font-size: 0.9rem;
}

.trend-day__accuracy {
  display: block;
  margin-top: 0.35rem;
  color: #1d3250;
  font-size: 1.08rem;
}

.trend-day__meta {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.35rem;
  color: #607089;
  font-size: 0.88rem;
}

@media (max-width: 640px) {
  .trend-chart__summary {
    flex-direction: column;
  }
}
</style>
