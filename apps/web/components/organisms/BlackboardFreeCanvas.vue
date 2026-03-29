<template>
  <canvas
    ref="canvas"
    class="free-canvas"
    :aria-label="t('blackboard.freeCanvas.ariaLabel')"
    @touchstart="startStroke"
    @touchmove="continueStroke"
    @touchend="stopStroke"
    @touchcancel="stopStroke"
    @mousedown="startStroke"
    @mousemove="continueStroke"
    @mouseup="stopStroke"
    @mouseleave="stopStroke"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useResponsiveCanvas } from '@/composables/useResponsiveCanvas'
import { getCanvasEventPoint } from '@/utils/blackboard-tracing'

const props = defineProps<{
  clearVersion: number
  selectedColor: string
}>()

const { t } = useI18n()
const { canvas, context } = useResponsiveCanvas()

const isDrawing = ref(false)
const lastPoint = ref({
  x: 0,
  y: 0,
})

function clearCanvas() {
  const currentContext = context.value
  const currentCanvas = canvas.value

  if (!currentContext || !currentCanvas) return

  const rect = currentCanvas.getBoundingClientRect()
  currentContext.clearRect(0, 0, rect.width, rect.height)
}

function startStroke(event: MouseEvent | TouchEvent) {
  const currentCanvas = canvas.value
  const currentContext = context.value

  if (!currentCanvas || !currentContext) return

  isDrawing.value = true
  lastPoint.value = getCanvasEventPoint(event, currentCanvas)
}

function continueStroke(event: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return

  const currentCanvas = canvas.value
  const currentContext = context.value

  if (!currentCanvas || !currentContext) return

  event.preventDefault()

  const nextPoint = getCanvasEventPoint(event, currentCanvas)

  currentContext.beginPath()
  currentContext.moveTo(lastPoint.value.x, lastPoint.value.y)
  currentContext.lineTo(nextPoint.x, nextPoint.y)
  currentContext.strokeStyle = props.selectedColor
  currentContext.lineWidth = 4
  currentContext.lineCap = 'round'
  currentContext.stroke()

  lastPoint.value = nextPoint
}

function stopStroke() {
  isDrawing.value = false
}

watch(
  () => props.clearVersion,
  () => {
    clearCanvas()
  }
)
</script>

<style scoped>
.free-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: #fff;
  cursor: crosshair;
  touch-action: none;
}
</style>
