import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TraceActivityStatus } from '@/types/blackboard'

export type BlackboardNumbersOutcome = 'next-number' | 'finished'

const FIRST_NUMBER = 1
const LAST_NUMBER = 9
const DISPLAY_COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#4D96FF',
  '#6BCB77',
  '#FF8000',
  '#B26CE6',
  '#00C2CB',
  '#FF9F1C',
]

function pickNextDisplayColor(currentColor: string) {
  const alternatives = DISPLAY_COLORS.filter((color) => color !== currentColor)
  const nextIndex = Math.floor(Math.random() * alternatives.length)
  return alternatives[nextIndex] ?? DISPLAY_COLORS[0]
}

export const useBlackboardNumbersStore = defineStore('blackboard-numbers', () => {
  const currentNumber = ref(FIRST_NUMBER)
  const displayColor = ref(DISPLAY_COLORS[0])
  const status = ref<TraceActivityStatus>('tracing')

  const isLastNumber = computed(() => currentNumber.value === LAST_NUMBER)

  function restart() {
    currentNumber.value = FIRST_NUMBER
    displayColor.value = DISPLAY_COLORS[0]
    status.value = 'tracing'
  }

  function markCompleted() {
    status.value = 'completed'
    displayColor.value = pickNextDisplayColor(displayColor.value)
  }

  function advanceAfterCompletion(): BlackboardNumbersOutcome {
    if (!isLastNumber.value) {
      currentNumber.value += 1
      status.value = 'tracing'
      return 'next-number'
    }

    status.value = 'finished'
    return 'finished'
  }

  return {
    advanceAfterCompletion,
    currentNumber,
    displayColor,
    isLastNumber,
    markCompleted,
    restart,
    status,
  }
})
