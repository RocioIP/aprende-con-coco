import { computed } from 'vue'
import type {
  AuthChild,
  AuthSessionResponse,
  LoginChildPayload,
  RegisterChildPayload,
  UnlockAdminPayload,
  UpdateProfilePayload,
} from '@/types/auth'
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

export function useAuthSession() {
  const api = useApi()
  const child = useState<AuthChild | null>('auth-child', () => null)
  const adminUnlocked = useState<boolean>('auth-admin-unlocked', () => false)
  const isInitialized = useState<boolean>('auth-session-ready', () => false)
  const isLoading = useState<boolean>('auth-session-loading', () => false)
  const errorMessage = useState<string>('auth-session-error', () => '')

  const isAuthenticated = computed(() => Boolean(child.value))

  function applySession(session: AuthSessionResponse | null) {
    child.value = session?.child ?? null
    adminUnlocked.value = session?.adminUnlocked ?? false
    isInitialized.value = true
  }

  async function ensureSession(force = false) {
    if (isLoading.value || (isInitialized.value && !force)) {
      return child.value
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const session = await api.get<AuthSessionResponse>('/auth/me')
      applySession(session)
      return child.value
    } catch (error) {
      applySession(null)
      const message = getErrorMessage(error)
      if (message !== 'auth_required' && message !== 'session_invalid') {
        errorMessage.value =
          message === 'fetch failed'
            ? `No se pudo conectar con la API en ${api.apiBase}`
            : message
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function registerChild(payload: RegisterChildPayload) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const session = await api.post<AuthSessionResponse, RegisterChildPayload>(
        '/auth/register-child',
        payload
      )
      applySession(session)
      return session
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loginChild(payload: LoginChildPayload) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const session = await api.post<AuthSessionResponse, LoginChildPayload>(
        '/auth/login-child',
        payload
      )
      applySession(session)
      return session
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function unlockAdmin(payload: UnlockAdminPayload) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const session = await api.post<AuthSessionResponse, UnlockAdminPayload>(
        '/auth/unlock-admin',
        payload
      )
      applySession(session)
      return session
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function lockAdmin() {
    try {
      const session = await api.post<AuthSessionResponse>('/auth/lock-admin')
      applySession(session)
      return session
    } catch {
      adminUnlocked.value = false
      return null
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const session = await api.patch<AuthSessionResponse, UpdateProfilePayload>(
        '/auth/profile',
        payload
      )
      applySession(session)
      return session
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await api.post<null>('/auth/logout')
    } finally {
      applySession(null)
    }
  }

  return {
    adminUnlocked,
    child,
    ensureSession,
    errorMessage,
    isAuthenticated,
    isInitialized,
    isLoading,
    lockAdmin,
    loginChild,
    logout,
    registerChild,
    unlockAdmin,
    updateProfile,
  }
}
