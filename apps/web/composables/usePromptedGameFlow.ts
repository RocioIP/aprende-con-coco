import { onBeforeUnmount, onMounted } from 'vue'
import { wait } from '@/utils/game-effects'

interface UsePromptedGameFlowOptions {
  initialDelayMs?: number
  prompt: () => void | Promise<void>
  start: () => void | Promise<void>
}

export function usePromptedGameFlow({
  initialDelayMs = 0,
  prompt,
  start,
}: UsePromptedGameFlowOptions) {
  let isActive = true
  let executionId = 0

  async function run() {
    const currentExecutionId = ++executionId
    await start()

    if (!isActive || currentExecutionId !== executionId) return

    if (initialDelayMs > 0) {
      await wait(initialDelayMs)
    }

    if (!isActive || currentExecutionId !== executionId) return

    await prompt()
  }

  async function replayPrompt() {
    if (!isActive) return

    await prompt()
  }

  onMounted(() => {
    void run()
  })

  onBeforeUnmount(() => {
    isActive = false
    executionId += 1
  })

  return {
    replayPrompt,
    restart: run,
  }
}
