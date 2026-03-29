import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  BlackboardActivity,
  BlackboardActivityOption,
  BlackboardColorOption,
} from '@/types/blackboard'

const BLACKBOARD_COLORS: BlackboardColorOption[] = [
  { id: 'black', value: '#000000', labelKey: 'blackboard.colors.black' },
  { id: 'red', value: '#ff0000', labelKey: 'blackboard.colors.red' },
  { id: 'navy', value: '#060cb1', labelKey: 'blackboard.colors.navy' },
  { id: 'sky', value: '#00bfff', labelKey: 'blackboard.colors.sky' },
  { id: 'green', value: '#32cd32', labelKey: 'blackboard.colors.green' },
  { id: 'yellow', value: '#fddf0c', labelKey: 'blackboard.colors.yellow' },
  { id: 'orange', value: '#f98505', labelKey: 'blackboard.colors.orange' },
  { id: 'purple', value: '#800080', labelKey: 'blackboard.colors.purple' },
  { id: 'pink', value: '#df0cfd', labelKey: 'blackboard.colors.pink' },
]

const BLACKBOARD_ACTIVITIES: BlackboardActivityOption[] = [
  { id: 'free', icon: '✏️ 🎨', labelKey: 'blackboard.activities.free' },
  { id: 'numbers', icon: '1 2 3', labelKey: 'blackboard.activities.numbers' },
  { id: 'figures', icon: '🟥 ⭐ 🟢', labelKey: 'blackboard.activities.figures' },
]

export const useBlackboardWorkspaceStore = defineStore('blackboard-workspace', () => {
  const activeActivity = ref<BlackboardActivity>('free')
  const selectedColor = ref(BLACKBOARD_COLORS[0].value)
  const clearVersion = ref(0)

  const isFreeDrawing = computed(() => activeActivity.value === 'free')

  function setActivity(activity: BlackboardActivity) {
    activeActivity.value = activity
  }

  function selectColor(color: string) {
    if (!BLACKBOARD_COLORS.some((option) => option.value === color)) {
      return
    }

    selectedColor.value = color
  }

  function requestClear() {
    clearVersion.value += 1
  }

  function reset() {
    activeActivity.value = 'free'
    selectedColor.value = BLACKBOARD_COLORS[0].value
    clearVersion.value = 0
  }

  return {
    activeActivity,
    activities: BLACKBOARD_ACTIVITIES,
    clearVersion,
    colors: BLACKBOARD_COLORS,
    isFreeDrawing,
    requestClear,
    reset,
    selectColor,
    selectedColor,
    setActivity,
  }
})
