import { APP_ROUTES } from '@/constants/routes'
import { useAuthSession } from '@/composables/useAuthSession'

const PUBLIC_PATHS = new Set([
  APP_ROUTES.home,
  APP_ROUTES.login,
  APP_ROUTES.register,
  '/debug-api',
])

const PUBLIC_PREFIXES = [APP_ROUTES.games, APP_ROUTES.stories, APP_ROUTES.blackboard]

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const auth = useAuthSession()
  await auth.ensureSession()

  const isPublicPath =
    PUBLIC_PATHS.has(to.path) || PUBLIC_PREFIXES.some((prefix) => to.path.startsWith(`${prefix}/`) || to.path === prefix)

  if (isPublicPath) {
    if (auth.isAuthenticated.value && (to.path === APP_ROUTES.login || to.path === APP_ROUTES.register)) {
      return navigateTo(APP_ROUTES.home)
    }

    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo(APP_ROUTES.login)
  }
})
