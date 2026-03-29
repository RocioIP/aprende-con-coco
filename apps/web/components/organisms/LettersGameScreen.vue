<template>
  <div class="container py-5 text-center position-relative">
    <div v-if="!gameStore.hasWon">
      <h2 class="mb-4 display-5 fw-bold">{{ promptText }}</h2>

      <div class="target-letter mb-5 mx-auto">
        {{ gameStore.currentQuestion?.letter }}
      </div>

      <div class="row justify-content-center g-4">
        <div
          v-for="option in gameStore.currentQuestion?.options ?? []"
          :key="option"
          class="col-6 col-md-3"
        >
          <Bell
            :disabled="gameStore.isLocked"
            :letter="option"
            :state="optionState(option)"
            @choose="onChoose"
          />
        </div>
      </div>
    </div>

    <GameWinOverlay
      v-else
      :image-alt="t('home.mascotAlt')"
      :title="t('common.messages.congrats')"
      @close="goToGames"
      @play-again="resetGame"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Bell from '@/components/atoms/Bell.vue'
import GameWinOverlay from '@/components/organisms/GameWinOverlay.vue'
import { useActivitySessionTracker } from '@/composables/useActivitySessionTracker'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useQuizAnswerFlow } from '@/composables/useQuizAnswerFlow'
import { useGameScreenSession } from '@/composables/useGameScreenSession'
import { usePromptedGameFlow } from '@/composables/usePromptedGameFlow'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useLettersGameStore } from '@/stores/games/letters'
import { launchCenteredConfetti, launchPointConfetti } from '@/utils/game-effects'

interface BellChoosePayload {
  center: { x: number; y: number } | null
  letter: string
}

const QUESTION_PAUSE_MS = 500

const { t } = useI18n()
const gameStore = useLettersGameStore()
const feedbackPlayer = useAudioPlayer()
const { prefersReducedMotion } = useReducedMotion()
const { cancel, speak } = useSpeechSynthesis()
const activityTracker = useActivitySessionTracker()
const { goToGames } = useGameScreenSession([cancel, feedbackPlayer.stop])
const questionStartedAt = ref(0)
const questionAttemptCount = ref(0)
const responseSequence = ref(0)

const promptText = computed(() =>
  t('games.letters.prompt', { letter: gameStore.currentQuestion?.letter ?? '' })
)

const { replayPrompt, restart } = usePromptedGameFlow({
  prompt: speakPrompt,
  start: () => {
    gameStore.startGame()
    questionAttemptCount.value = 0
    responseSequence.value = 0
    void activityTracker.startSession({
      activityCode: 'letters',
      difficultyStart: 1,
      metadata: {
        optionsPerQuestion: gameStore.currentQuestion?.options.length ?? 0,
        questionsPerRound: gameStore.questions.length,
      },
    })
    activityTracker.trackEvent({
      type: 'session_started',
      payload: {
        optionsPerQuestion: gameStore.currentQuestion?.options.length ?? 0,
        questionsPerRound: gameStore.questions.length,
      },
    })
  },
})
const { submitAnswer } = useQuizAnswerFlow<BellChoosePayload>({
  beforeFinish: () => nextTick(),
  finishGame: () => {
    gameStore.finishGame()
  },
  goToNextQuestion: () => {
    gameStore.goToNextQuestion()
  },
  isLastQuestion: () => gameStore.isLastQuestion,
  markCorrect: ({ letter }) => {
    gameStore.markCorrect(letter)
  },
  markWrong: ({ letter }) => {
    gameStore.markWrong(letter)
  },
  onAdvance: replayPrompt,
  onCorrect: async ({ center }) => {
    if (center && !prefersReducedMotion.value) {
      launchPointConfetti(center, {
        particleCount: 140,
        spread: 75,
        startVelocity: 40,
      })
    }

    await feedbackPlayer.play('/sounds/dingdong.mp3', { waitForEnd: true })
  },
  onWin: () => {
    activityTracker.trackEvent({
      type: 'session_completed',
      payload: {
        questionsPerRound: gameStore.questions.length,
      },
    })
    void activityTracker.finishSession({
      status: 'completed',
      difficultyEnd: 1,
      metadata: {
        questionsPerRound: gameStore.questions.length,
      },
    })

    if (!prefersReducedMotion.value) {
      launchCenteredConfetti({
        particleCount: 200,
        spread: 100,
        startVelocity: 45,
      })
    }
    speak(t('common.messages.congrats'))
  },
  onWrong: async () => {
    await feedbackPlayer.play('/sounds/error.mp3', { waitForEnd: true })
  },
  resetFeedback: () => {
    gameStore.resetFeedback()
  },
})

function optionState(option: string) {
  if (gameStore.result !== 'correct') return null
  return option === gameStore.currentQuestion?.answer ? 'correct' : null
}

async function onChoose({ letter, center }: BellChoosePayload) {
  if (gameStore.isLocked || !gameStore.currentQuestion) return

  const currentQuestion = gameStore.currentQuestion
  const isCorrect = letter === currentQuestion.answer
  questionAttemptCount.value += 1
  responseSequence.value += 1

  activityTracker.trackResponse({
    sequence: responseSequence.value,
    promptType: 'letter_choice',
    prompt: {
      letter: currentQuestion.letter,
      options: currentQuestion.options,
    },
    expected: {
      letter: currentQuestion.answer,
    },
    answer: {
      letter,
    },
    attemptNumber: questionAttemptCount.value,
    isCorrect,
    reactionMs: Math.max(0, Date.now() - questionStartedAt.value),
    metadata: {
      questionIndex: gameStore.index + 1,
      targetLetter: currentQuestion.letter,
    },
  })

  await submitAnswer({ letter, center }, isCorrect)
}

function resetGame() {
  void restart()
}

function speakPrompt() {
  if (!gameStore.currentQuestion) return

  questionStartedAt.value = Date.now()
  questionAttemptCount.value = 0

  const letter = gameStore.currentQuestion.letter
  const first = t('games.letters.speakFirst', { letter })
  const second = t('games.letters.speakSecond')

  speak(first, {
    onend: () => {
      window.setTimeout(() => {
        speak(second)
      }, QUESTION_PAUSE_MS)
    },
  })
}
</script>

<style scoped>
.target-letter {
  font-size: 6rem;
  font-weight: bold;
  color: #0dcaf0;
  background: #e7f9ff;
  width: 140px;
  height: 140px;
  line-height: 140px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  user-select: none;
}
</style>
