import { ref } from 'vue'
import { useAuthSession } from '@/composables/useAuthSession'
import { useApi } from '@/utils/api'
import type { ChildDashboard } from '@/types/progress'

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

export function useChildDashboard() {
  const api = useApi()
  const auth = useAuthSession()
  const dashboard = ref<ChildDashboard | null>(null)
  const isLoadingDashboard = ref(false)
  const errorMessage = ref('')
  let dashboardRequestToken = 0

  async function loadDashboard() {
    const currentToken = ++dashboardRequestToken
    isLoadingDashboard.value = true
    errorMessage.value = ''

    try {
      await auth.ensureSession()

      if (!auth.isAuthenticated.value) {
        dashboard.value = null
        return
      }

      const result = await api.get<ChildDashboard>('/auth/dashboard')

      if (currentToken !== dashboardRequestToken) {
        return
      }

      dashboard.value = result
    } catch (error) {
      if (currentToken !== dashboardRequestToken) {
        return
      }

      dashboard.value = null
      const message = getErrorMessage(error)
      errorMessage.value =
        message === 'fetch failed'
          ? `No se pudo conectar con la API en ${api.apiBase}`
          : message
    } finally {
      if (currentToken === dashboardRequestToken) {
        isLoadingDashboard.value = false
      }
    }
  }

  return {
    auth,
    dashboard,
    errorMessage,
    isLoadingDashboard,
    loadDashboard,
  }
}
