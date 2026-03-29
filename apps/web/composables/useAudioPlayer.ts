import { ref } from 'vue'

interface PlayAudioOptions {
  reset?: boolean
  waitForEnd?: boolean
}

export function useAudioPlayer() {
  const activeAudio = ref<HTMLAudioElement | null>(null)

  function stop() {
    if (!import.meta.client || !activeAudio.value) return

    activeAudio.value.pause()
    activeAudio.value.currentTime = 0
    activeAudio.value = null
  }

  async function play(src: string, options: PlayAudioOptions = {}) {
    const { reset = true, waitForEnd = false } = options

    if (!import.meta.client) return false

    if (reset) {
      stop()
    }

    const audio = new Audio(src)
    activeAudio.value = audio

    if (!waitForEnd) {
      try {
        await audio.play()
        return true
      } catch {
        if (activeAudio.value === audio) {
          activeAudio.value = null
        }

        return false
      }
    }

    return new Promise<boolean>((resolve) => {
      const finalize = (played: boolean) => {
        if (activeAudio.value === audio) {
          activeAudio.value = null
        }

        resolve(played)
      }

      audio.onended = () => finalize(true)
      audio.onerror = () => finalize(false)

      audio.play().catch(() => finalize(false))
    })
  }

  return {
    play,
    stop,
  }
}
