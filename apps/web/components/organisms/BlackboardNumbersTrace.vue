<template>
  <div class="trace-game">
    <canvas
      ref="canvas"
      class="trace-canvas"
      :aria-label="t('blackboard.numbers.canvasLabel')"
      @touchstart="startFromEvent"
      @touchmove="drawFromEvent"
      @touchend="stop"
      @touchcancel="stop"
      @mousedown="startFromEvent"
      @mousemove="drawFromEvent"
      @mouseup="stop"
      @mouseleave="stop"
    />

    <div
      v-if="status === 'completed'"
      class="completed-number"
      :style="{ color: displayColor, fontSize: `${visibleNumberFontSize}px` }"
    >
      {{ currentNumber }}
    </div>

    <GameWinOverlay
      v-if="status === 'finished'"
      :title="t('blackboard.numbers.winTitle')"
      :message="t('blackboard.numbers.winMessage')"
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
import { useBlackboardNumbersStore } from '@/stores/blackboard/numbers'
import { buildNumberTracePoints } from '@/utils/blackboard-tracing'
import { launchCenteredConfetti, wait } from '@/utils/game-effects'

const emit = defineEmits<{
  finalizado: []
}>()

const { t } = useI18n()
const { cancel, speak } = useSpeechSynthesis()
const { prefersReducedMotion } = useReducedMotion()
const gameStore = useBlackboardNumbersStore()
const { currentNumber, displayColor, status } = storeToRefs(gameStore)

let runToken = 0

gameStore.restart()

const { canvas, context, size } = useResponsiveCanvas({
  onResize: renderNumberGuide,
})

const visibleNumberFontSize = computed(() => Math.max(64, Math.floor(size.value.height * 0.52)))

const { drawFromEvent, setPoints, startFromEvent, stop } = useTraceDotsCanvas(canvas, context, {
  onComplete: () => {
    void handleNumberCompleted()
  },
})

function renderNumberGuide() {
  if (!size.value.width || !size.value.height) return

  setPoints(buildNumberTracePoints(currentNumber.value, size.value))
}

function promptCurrentNumber() {
  speak(t('blackboard.numbers.speakPrompt', { number: currentNumber.value }))
}

async function handleNumberCompleted() {
  if (status.value !== 'tracing') return

  const token = ++runToken

  gameStore.markCompleted()

  if (!prefersReducedMotion.value) {
    launchCenteredConfetti({
      particleCount: 100,
      spread: 80,
    })
  }

  await wait(1100)

  if (token !== runToken) return

  const outcome = gameStore.advanceAfterCompletion()

  if (outcome === 'next-number') {
    promptCurrentNumber()
    return
  }

  if (!prefersReducedMotion.value) {
    launchCenteredConfetti({
      particleCount: 180,
      spread: 100,
      startVelocity: 45,
    })
  }

  speak(t('blackboard.numbers.winSpeech'))
}

function restartGame() {
  runToken += 1
  gameStore.restart()
  renderNumberGuide()
  promptCurrentNumber()
}

function closeGame() {
  runToken += 1
  cancel()
  emit('finalizado')
}

watch(currentNumber, () => {
  if (status.value !== 'tracing') return

  renderNumberGuide()
})

onMounted(() => {
  promptCurrentNumber()
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

.completed-number {
  position: absolute;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .completed-number {
    text-shadow: none;
  }
}
</style>
