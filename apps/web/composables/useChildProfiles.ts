import { computed, ref } from 'vue'
import { useActiveChild } from '@/composables/useActiveChild'
import type { ChildSummary } from '@/types/progress'
import { useApi } from '@/utils/api'

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    if ('data' in error && typeof error.data === 'object' && error.data !== null) {
      const data = error.data as { error?: string; message?: string }
      return data.message ?? data.error ?? 'request_failed'
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
  }

  return 'request_failed'
}

export function useChildProfiles() {
  const api = useApi()
  const { activeChildId, setActiveChildId } = useActiveChild()
  const children = useState<ChildSummary[]>('child-profiles-list', () => [])
  const hasLoaded = useState<boolean>('child-profiles-loaded', () => false)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const activeChild = computed(() => {
    return children.value.find((child) => child.id === activeChildId.value) ?? null
  })

  async function loadChildren(force = false) {
    if (isLoading.value || (hasLoaded.value && !force)) {
      return children.value
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const list = await api.get<ChildSummary[]>('/children')
      children.value = list
      hasLoaded.value = true

      if (!list.length) {
        return children.value
      }

      const hasActiveChild = list.some((child) => child.id === activeChildId.value)
      if (!hasActiveChild) {
        setActiveChildId(list[0].id)
      }

      return children.value
    } catch (error) {
      const message = getErrorMessage(error)
      errorMessage.value =
        message === 'fetch failed'
          ? `No se pudo conectar con la API en ${api.apiBase}`
          : message
      return children.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    activeChild,
    activeChildId,
    children,
    errorMessage,
    hasLoaded,
    isLoading,
    loadChildren,
    setActiveChildId,
  }
}
