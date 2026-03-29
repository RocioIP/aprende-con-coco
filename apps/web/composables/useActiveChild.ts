import { computed } from 'vue'
import { useAuthSession } from '@/composables/useAuthSession'

export function useActiveChild() {
  const { child } = useAuthSession()
  const activeChildId = computed(() => child.value?.id ?? 0)

  function setActiveChildId(_: number) {
    if (import.meta.dev) {
      console.warn('[auth] active child is now driven by the authenticated session')
    }
  }

  return {
    activeChildId,
    setActiveChildId,
  }
}
