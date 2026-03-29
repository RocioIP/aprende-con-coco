import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'

function normalizePath(path: string) {
  const strippedPath = path.split(/[?#]/)[0] ?? '/'

  if (strippedPath === '/') {
    return strippedPath
  }

  return strippedPath.replace(/\/+$/, '') || '/'
}

export function isRouteActive(currentPath: string, targetPath: string) {
  const normalizedCurrentPath = normalizePath(currentPath)
  const normalizedTargetPath = normalizePath(targetPath)

  if (normalizedCurrentPath === normalizedTargetPath) {
    return true
  }

  if (normalizedTargetPath === '/') {
    return normalizedCurrentPath === normalizedTargetPath
  }

  return normalizedCurrentPath.startsWith(`${normalizedTargetPath}/`)
}

export function useRouteMatcher() {
  const route = useRoute()

  function matches(targetPath: string) {
    return isRouteActive(route.path, targetPath)
  }

  return {
    currentPath: computed(() => normalizePath(route.path)),
    matches,
  }
}

export function useRouteTargetState(targetPath: MaybeRefOrGetter<string>) {
  const route = useRoute()

  const isActive = computed(() => isRouteActive(route.path, toValue(targetPath)))

  return {
    isActive,
  }
}
