import { ref, type Ref } from 'vue'
import type { TracePoint } from '@/types/blackboard'
import { drawTraceDots, getCanvasEventPoint } from '@/utils/blackboard-tracing'

interface UseTraceDotsCanvasOptions {
  dotRadius?: number
  guideFill?: string
  onComplete?: () => void
  threshold?: number
  visitedFill?: string
}

export function useTraceDotsCanvas(
  canvas: Ref<HTMLCanvasElement | null>,
  context: Ref<CanvasRenderingContext2D | null>,
  options: UseTraceDotsCanvasOptions = {}
) {
  const dotRadius = options.dotRadius ?? 10
  const guideFill = options.guideFill ?? 'rgba(0, 0, 0, 0.15)'
  const visitedFill = options.visitedFill ?? '#32cd32'
  const threshold = options.threshold ?? 25

  const isDrawing = ref(false)
  const points = ref<TracePoint[]>([])
  const visitedIndexes = ref<Set<number>>(new Set())

  function redraw() {
    const currentContext = context.value
    const currentCanvas = canvas.value

    if (!currentContext || !currentCanvas) return

    const rect = currentCanvas.getBoundingClientRect()
    currentContext.clearRect(0, 0, rect.width, rect.height)

    drawTraceDots(currentContext, points.value, {
      fillStyle: guideFill,
      radius: dotRadius,
    })

    const visitedPoints = Array.from(visitedIndexes.value)
      .map((index) => points.value[index])
      .filter((point): point is TracePoint => Boolean(point))

    drawTraceDots(currentContext, visitedPoints, {
      fillStyle: visitedFill,
      radius: dotRadius,
    })
  }

  function setPoints(nextPoints: TracePoint[]) {
    points.value = nextPoints
    visitedIndexes.value = new Set()
    redraw()
  }

  function stop() {
    isDrawing.value = false
  }

  function visitPoint(x: number, y: number) {
    if (points.value.length === 0) return

    points.value.forEach((point, index) => {
      if (visitedIndexes.value.has(index)) {
        return
      }

      if (Math.hypot(point.x - x, point.y - y) < threshold) {
        visitedIndexes.value.add(index)
      }
    })

    redraw()

    if (visitedIndexes.value.size === points.value.length) {
      isDrawing.value = false
      options.onComplete?.()
    }
  }

  function startFromEvent(event: MouseEvent | TouchEvent) {
    const currentCanvas = canvas.value

    if (!currentCanvas) return

    isDrawing.value = true

    const point = getCanvasEventPoint(event, currentCanvas)
    visitPoint(point.x, point.y)
  }

  function drawFromEvent(event: MouseEvent | TouchEvent) {
    if (!isDrawing.value) return

    const currentCanvas = canvas.value

    if (!currentCanvas) return

    event.preventDefault()

    const point = getCanvasEventPoint(event, currentCanvas)
    visitPoint(point.x, point.y)
  }

  return {
    drawFromEvent,
    isDrawing,
    points,
    redraw,
    setPoints,
    startFromEvent,
    stop,
    visitedIndexes,
  }
}
