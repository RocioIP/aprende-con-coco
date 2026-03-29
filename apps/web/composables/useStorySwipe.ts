import { computed, ref } from 'vue'

interface UseStorySwipeOptions {
  canGoNext: () => boolean
  canGoPrevious: () => boolean
  onGoNext: () => void
  onGoPrevious: () => void
}

const SWIPE_THRESHOLD = 72
const MAX_DRAG = 150
const INTENT_THRESHOLD = 14
const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [data-no-swipe]'

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export function useStorySwipe(options: UseStorySwipeOptions) {
  const startX = ref(0)
  const startY = ref(0)
  const dragX = ref(0)
  const isDragging = ref(false)
  const axisLock = ref<'x' | 'y' | null>(null)
  const activePointerId = ref<number | null>(null)

  function resetGesture() {
    dragX.value = 0
    isDragging.value = false
    axisLock.value = null
    activePointerId.value = null
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (isInteractiveTarget(event.target)) return

    const currentTarget = event.currentTarget
    if (currentTarget instanceof HTMLElement) {
      currentTarget.setPointerCapture(event.pointerId)
    }

    startX.value = event.clientX
    startY.value = event.clientY
    dragX.value = 0
    isDragging.value = true
    axisLock.value = null
    activePointerId.value = event.pointerId
  }

  function onPointerMove(event: PointerEvent) {
    if (activePointerId.value !== event.pointerId) return
    if (!isDragging.value) return

    const deltaX = event.clientX - startX.value
    const deltaY = event.clientY - startY.value

    if (!axisLock.value && Math.abs(deltaX) + Math.abs(deltaY) >= INTENT_THRESHOLD) {
      axisLock.value = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
    }

    if (axisLock.value !== 'x') return

    dragX.value = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX))
  }

  function onPointerUp(event: PointerEvent) {
    if (activePointerId.value !== event.pointerId) return
    if (!isDragging.value) return

    const currentTarget = event.currentTarget
    if (currentTarget instanceof HTMLElement && currentTarget.hasPointerCapture(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId)
    }

    const deltaX = dragX.value
    const isHorizontalSwipe = axisLock.value === 'x'

    resetGesture()

    if (!isHorizontalSwipe) return

    if (deltaX <= -SWIPE_THRESHOLD && options.canGoNext()) {
      options.onGoNext()
      return
    }

    if (deltaX >= SWIPE_THRESHOLD && options.canGoPrevious()) {
      options.onGoPrevious()
    }
  }

  function onPointerCancel(event: PointerEvent) {
    if (activePointerId.value !== null && activePointerId.value !== event.pointerId) return

    const currentTarget = event.currentTarget
    if (currentTarget instanceof HTMLElement && currentTarget.hasPointerCapture(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId)
    }

    resetGesture()
  }

  const dragStyle = computed(() => {
    if (!isDragging.value || axisLock.value !== 'x') return undefined

    return {
      transform: `translateX(${dragX.value}px) rotate(${dragX.value / 90}deg)`,
    }
  })

  return {
    dragStyle,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
