import { onBeforeUnmount, onMounted, ref } from 'vue'

const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotion() {
  const prefersReducedMotion = ref(false)

  let mediaQueryList: MediaQueryList | null = null

  function updatePreference(matches: boolean) {
    prefersReducedMotion.value = matches
  }

  function handleChange(event: MediaQueryListEvent) {
    updatePreference(event.matches)
  }

  onMounted(() => {
    if (!window.matchMedia) return

    mediaQueryList = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY)
    updatePreference(mediaQueryList.matches)

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange)
      return
    }

    mediaQueryList.addListener(handleChange)
  })

  onBeforeUnmount(() => {
    if (!mediaQueryList) return

    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', handleChange)
      return
    }

    mediaQueryList.removeListener(handleChange)
  })

  return {
    prefersReducedMotion,
  }
}
