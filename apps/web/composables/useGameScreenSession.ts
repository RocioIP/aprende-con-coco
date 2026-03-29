import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { APP_ROUTES } from '@/constants/routes'

type CleanupHandler = () => void

export function useGameScreenSession(initialHandlers: CleanupHandler[] = []) {
  const router = useRouter()
  const cleanupHandlers = new Set(initialHandlers)

  function registerCleanup(handler: CleanupHandler) {
    cleanupHandlers.add(handler)

    return () => {
      cleanupHandlers.delete(handler)
    }
  }

  function cleanup() {
    for (const handler of cleanupHandlers) {
      try {
        handler()
      } catch {
        // Ignore teardown failures from browser media APIs.
      }
    }
  }

  function goToGames() {
    cleanup()
    return router.push(APP_ROUTES.games)
  }

  onBeforeUnmount(cleanup)

  return {
    cleanup,
    goToGames,
    registerCleanup,
  }
}
