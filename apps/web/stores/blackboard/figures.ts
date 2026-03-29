import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { BlackboardFigureId, TraceActivityStatus } from '@/types/blackboard'

export type BlackboardFiguresOutcome = 'next-figure' | 'finished'

const FIGURE_SEQUENCE: BlackboardFigureId[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'star',
  'heart',
]

export const useBlackboardFiguresStore = defineStore('blackboard-figures', () => {
  const currentIndex = ref(0)
  const status = ref<TraceActivityStatus>('tracing')

  const currentFigureId = computed(() => FIGURE_SEQUENCE[currentIndex.value])
  const isLastFigure = computed(() => currentIndex.value === FIGURE_SEQUENCE.length - 1)

  function restart() {
    currentIndex.value = 0
    status.value = 'tracing'
  }

  function markCompleted() {
    status.value = 'completed'
  }

  function advanceAfterCompletion(): BlackboardFiguresOutcome {
    if (!isLastFigure.value) {
      currentIndex.value += 1
      status.value = 'tracing'
      return 'next-figure'
    }

    status.value = 'finished'
    return 'finished'
  }

  return {
    advanceAfterCompletion,
    currentFigureId,
    currentIndex,
    isLastFigure,
    markCompleted,
    restart,
    status,
  }
})
