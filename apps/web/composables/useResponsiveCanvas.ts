import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { CanvasSize } from '@/types/blackboard'

interface UseResponsiveCanvasOptions {
  onResize?: (size: CanvasSize, context: CanvasRenderingContext2D) => void
}

export function useResponsiveCanvas(options: UseResponsiveCanvasOptions = {}) {
  const canvas = ref<HTMLCanvasElement | null>(null)
  const context = ref<CanvasRenderingContext2D | null>(null)
  const size = ref<CanvasSize>({
    height: 0,
    width: 0,
  })

  let resizeObserver: ResizeObserver | null = null

  function syncCanvasSize() {
    if (!import.meta.client) return

    const element = canvas.value

    if (!element) return

    const rect = element.getBoundingClientRect()
    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1)

    element.width = Math.max(1, Math.floor(rect.width * devicePixelRatio))
    element.height = Math.max(1, Math.floor(rect.height * devicePixelRatio))
    element.style.width = `${rect.width}px`
    element.style.height = `${rect.height}px`

    const nextContext = element.getContext('2d')

    if (!nextContext) return

    nextContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

    context.value = nextContext
    size.value = {
      height: rect.height,
      width: rect.width,
    }

    options.onResize?.(size.value, nextContext)
  }

  onMounted(() => {
    if (!import.meta.client) return

    syncCanvasSize()

    if (typeof ResizeObserver !== 'undefined' && canvas.value) {
      resizeObserver = new ResizeObserver(() => {
        syncCanvasSize()
      })

      resizeObserver.observe(canvas.value)
    }

    window.addEventListener('orientationchange', syncCanvasSize)
    window.addEventListener('resize', syncCanvasSize)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()

    if (!import.meta.client) return

    window.removeEventListener('orientationchange', syncCanvasSize)
    window.removeEventListener('resize', syncCanvasSize)
  })

  return {
    canvas,
    context,
    size,
    syncCanvasSize,
  }
}
