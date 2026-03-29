import { onBeforeUnmount, ref } from 'vue'

interface UseTypedTextOptions {
  intervalMs?: number
}

export function useTypedText(options: UseTypedTextOptions = {}) {
  const { intervalMs = 100 } = options
  const displayedText = ref('')
  let typingInterval: ReturnType<typeof window.setInterval> | null = null

  function stopTyping() {
    if (typingInterval === null) return

    window.clearInterval(typingInterval)
    typingInterval = null
  }

  function startTyping(text: string) {
    stopTyping()

    if (!import.meta.client) {
      displayedText.value = text
      return
    }

    displayedText.value = ''

    if (!text) return

    let index = 0

    typingInterval = window.setInterval(() => {
      displayedText.value += text[index] ?? ''
      index += 1

      if (index >= text.length) {
        stopTyping()
      }
    }, intervalMs)
  }

  onBeforeUnmount(stopTyping)

  return {
    displayedText,
    startTyping,
    stopTyping,
  }
}
