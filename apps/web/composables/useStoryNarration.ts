import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'

type NarrationState = 'idle' | 'active' | 'complete'

export interface NarratedParagraph {
  index: number
  pendingText: string
  spokenText: string
  state: NarrationState
}

interface UseStoryNarrationOptions {
  paragraphs: ComputedRef<string[]>
  rate?: number
}

export function useStoryNarration(options: UseStoryNarrationOptions) {
  const { cancel, speak } = useSpeechSynthesis()
  const activeParagraphIndex = ref<number | null>(null)
  const activeCharIndex = ref(0)
  const completedParagraphCount = ref(0)
  const isNarrating = ref(false)

  let narrationToken = 0
  let fallbackDelayTimer: ReturnType<typeof setTimeout> | null = null
  let fallbackProgressTimer: ReturnType<typeof setInterval> | null = null

  const narratedParagraphs = computed<NarratedParagraph[]>(() =>
    options.paragraphs.value.map((paragraph, index) => {
      if (index < completedParagraphCount.value) {
        return {
          index,
          pendingText: '',
          spokenText: paragraph,
          state: 'complete',
        }
      }

      if (index === activeParagraphIndex.value) {
        const safeCharIndex = Math.max(0, Math.min(activeCharIndex.value, paragraph.length))

        return {
          index,
          pendingText: paragraph.slice(safeCharIndex),
          spokenText: paragraph.slice(0, safeCharIndex),
          state: 'active',
        }
      }

      return {
        index,
        pendingText: paragraph,
        spokenText: '',
        state: 'idle',
      }
    })
  )

  function clearNarrationTimers() {
    if (fallbackDelayTimer) {
      clearTimeout(fallbackDelayTimer)
      fallbackDelayTimer = null
    }

    if (fallbackProgressTimer) {
      clearInterval(fallbackProgressTimer)
      fallbackProgressTimer = null
    }
  }

  function resetNarrationState() {
    clearNarrationTimers()
    activeParagraphIndex.value = null
    activeCharIndex.value = 0
    completedParagraphCount.value = 0
    isNarrating.value = false
  }

  function stopNarration() {
    narrationToken += 1
    cancel()
    resetNarrationState()
  }

  function startFallbackProgress(paragraph: string, rate: number) {
    const normalizedRate = rate > 0 ? rate : 1
    const estimatedDurationMs = Math.max(
      1400,
      Math.round((paragraph.length / (11 * normalizedRate)) * 1000)
    )
    const startedAt = Date.now()

    clearNarrationTimers()

    fallbackProgressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const progress = Math.min(1, elapsed / estimatedDurationMs)

      activeCharIndex.value = Math.max(
        activeCharIndex.value,
        Math.floor(paragraph.length * progress)
      )

      if (progress >= 1) {
        clearNarrationTimers()
      }
    }, 50)
  }

  function speakParagraph(index: number, token: number) {
    if (token !== narrationToken) return

    const paragraph = options.paragraphs.value[index]?.trim()
    const narrationRate = options.rate ?? 0.9

    if (!paragraph) {
      if (index < options.paragraphs.value.length - 1) {
        speakParagraph(index + 1, token)
      } else {
        isNarrating.value = false
      }

      return
    }

    activeParagraphIndex.value = index
    activeCharIndex.value = 0

    let receivedBoundary = false

    speak(paragraph, {
      cancelPrevious: index === 0,
      onstart: () => {
        if (token !== narrationToken) return

        clearNarrationTimers()
        fallbackDelayTimer = setTimeout(() => {
          if (token !== narrationToken || receivedBoundary) return
          startFallbackProgress(paragraph, narrationRate)
        }, 260)
      },
      onboundary: (event) => {
        if (token !== narrationToken) return
        if (typeof event?.charIndex !== 'number') return

        receivedBoundary = true
        clearNarrationTimers()
        activeCharIndex.value = event.charIndex
      },
      onend: () => {
        if (token !== narrationToken) return

        clearNarrationTimers()
        activeCharIndex.value = paragraph.length
        completedParagraphCount.value = index + 1

        if (index >= options.paragraphs.value.length - 1) {
          activeParagraphIndex.value = null
          isNarrating.value = false
          return
        }

        window.setTimeout(() => {
          speakParagraph(index + 1, token)
        }, 140)
      },
      onerror: () => {
        if (token !== narrationToken) return
        resetNarrationState()
      },
      rate: narrationRate,
    })
  }

  function startNarration() {
    const paragraphs = options.paragraphs.value.map((paragraph) => paragraph.trim()).filter(Boolean)

    if (!paragraphs.length) return

    narrationToken += 1

    const token = narrationToken

    cancel()
    resetNarrationState()
    isNarrating.value = true

    speakParagraph(0, token)
  }

  function toggleNarration() {
    if (isNarrating.value) {
      stopNarration()
      return
    }

    startNarration()
  }

  watch(
    options.paragraphs,
    () => {
      stopNarration()
    },
    { deep: false }
  )

  onBeforeUnmount(() => {
    stopNarration()
  })

  return {
    isNarrating,
    narratedParagraphs,
    startNarration,
    stopNarration,
    toggleNarration,
  }
}
