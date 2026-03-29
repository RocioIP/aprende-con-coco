import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { defaultLocale, speechVoices, type AppLocale } from '@/lang'

interface SpeakOptions {
  cancelPrevious?: boolean
  lang?: string
  onboundary?: (event?: SpeechSynthesisEvent) => void
  onend?: (event?: SpeechSynthesisEvent) => void
  onerror?: (event?: SpeechSynthesisErrorEvent) => void
  onstart?: (event?: SpeechSynthesisEvent) => void
  pitch?: number
  rate?: number
}

export function useSpeechSynthesis() {
  const { locale } = useI18n()
  const voice = computed(
    () => speechVoices[locale.value as AppLocale] ?? speechVoices[defaultLocale]
  )

  function cancel() {
    if (!import.meta.client) return
    window.speechSynthesis.cancel()
  }

  function speak(text: string, options: SpeakOptions = {}) {
    const trimmedText = text?.trim()

    if (!trimmedText) {
      options.onend?.()
      return null
    }

    if (!import.meta.client) {
      options.onend?.()
      return null
    }

    const utterance = new SpeechSynthesisUtterance(trimmedText)
    utterance.lang = options.lang ?? voice.value

    if (options.rate) utterance.rate = options.rate
    if (options.pitch) utterance.pitch = options.pitch
    if (options.onboundary) utterance.onboundary = options.onboundary
    if (options.onend) utterance.onend = options.onend
    if (options.onerror) utterance.onerror = options.onerror
    if (options.onstart) utterance.onstart = options.onstart

    if (options.cancelPrevious ?? true) {
      cancel()
    }

    window.speechSynthesis.speak(utterance)

    return utterance
  }

  return {
    voice,
    speak,
    cancel,
  }
}
