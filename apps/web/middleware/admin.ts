import { APP_ROUTES } from '@/constants/routes'
import { useAuthSession } from '@/composables/useAuthSession'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const auth = useAuthSession()
  await auth.ensureSession()

  if (!auth.isAuthenticated.value) {
    return navigateTo(APP_ROUTES.login)
  }

  if (!auth.adminUnlocked.value) {
    return navigateTo(APP_ROUTES.home)
  }
})
