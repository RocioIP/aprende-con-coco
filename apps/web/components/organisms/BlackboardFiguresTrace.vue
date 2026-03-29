<template>
  <div class="trace-game">
    <canvas
      ref="canvas"
      class="trace-canvas"
      :aria-label="t('blackboard.figures.canvasLabel')"
      @touchstart="startFromEvent"
      @touchmove="drawFromEvent"
      @touchend="stop"
      @touchcancel="stop"
      @mousedown="startFromEvent"
      @mousemove="drawFromEvent"
      @mouseup="stop"
      @mouseleave="stop"
    />

    <div v-if="status === 'completed'" class="figure-preview">
      <img :src="currentFigureImage" :alt="t('blackboard.figures.imageAlt', { figure: currentFigureLabel })" />
    </div>

    <GameWinOverlay
      v-if="status === 'finished'"
      :title="t('blackboard.figures.winTitle')"
      :message="t('blackboard.figures.winMessage')"
      @playAgain="restartGame"
      @close="closeGame"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import GameWinOverlay from '@/components/organisms/GameWinOverlay.vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useResponsiveCanvas } from '@/composables/useResponsiveCanvas'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useTraceDotsCanvas } from '@/composables/useTraceDotsCanvas'
import { useBlackboardFiguresStore } from '@/stores/blackboard/figures'
import { FIGURE_IMAGE_BY_ID, buildFigureTracePoints } from '@/utils/blackboard-tracing'
import { launchCenteredConfetti, wait } from '@/utils/game-effects'

const emit = defineEmits<{
  finalizado: []
}>()

const { t } = useI18n()
const { cancel, speak } = useSpeechSynthesis()
const { prefersReducedMotion } = useReducedMotion()
const gameStore = useBlackboardFiguresStore()
const { currentFigureId, isLastFigure, status } = storeToRefs(gameStore)

let runToken = 0

gameStore.restart()

const { canvas, context, size } = useResponsiveCanvas({
  onResize: renderFigureGuide,
})

const { drawFromEvent, setPoints, startFromEvent, stop } = useTraceDotsCanvas(canvas, context, {
  onComplete: () => {
    void handleFigureCompleted()
  },
})

const currentFigureImage = computed(
  () => `/images/blackboard/figuras/${FIGURE_IMAGE_BY_ID[currentFigureId.value]}`
)
const currentFigureLabel = computed(() => t(`blackboard.figures.names.${currentFigureId.value}`))

function renderFigureGuide() {
  if (!size.value.width || !size.value.height) return

  setPoints(buildFigureTracePoints(currentFigureId.value, size.value))
}

function promptCurrentFigure() {
  speak(t('blackboard.figures.speakPrompt', { figure: currentFigureLabel.value }))
}

async function handleFigureCompleted() {
  if (status.value !== 'tracing') return

  const token = ++runToken
  const delay = isLastFigure.value ? 1500 : 2000

  gameStore.markCompleted()

  if (!prefersReducedMotion.value) {
    launchCenteredConfetti({
      particleCount: 100,
      spread: 90,
    })
  }

  await wait(delay)

  if (token !== runToken) return

  const outcome = gameStore.advanceAfterCompletion()

  if (outcome === 'next-figure') {
    promptCurrentFigure()
    return
  }

  speak(t('blackboard.figures.winSpeech'))
}

function restartGame() {
  runToken += 1
  gameStore.restart()
  renderFigureGuide()
  promptCurrentFigure()
}

function closeGame() {
  runToken += 1
  cancel()
  emit('finalizado')
}

watch(currentFigureId, () => {
  if (status.value !== 'tracing') return

  renderFigureGuide()
})

onMounted(() => {
  promptCurrentFigure()
})

onBeforeUnmount(() => {
  runToken += 1
  cancel()
})
</script>

<style scoped>
.trace-game {
  position: relative;
  width: 100%;
  height: 100%;
}

.trace-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: #fff;
  touch-action: none;
  cursor: crosshair;
}

.figure-preview {
  position: absolute;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  text-align: center;
  pointer-events: none;
}

.figure-preview img {
  max-width: 180px;
  max-height: 180px;
  animation: fade-in 0.8s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .figure-preview img {
    animation: none;
  }
}
</style>
