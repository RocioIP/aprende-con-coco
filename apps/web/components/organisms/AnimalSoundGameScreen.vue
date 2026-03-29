<template>
  <div class="container py-5 text-center position-relative overflow-hidden" style="min-height: 100vh;">
    <h2 v-if="!gameStore.hasWon" class="mb-4 display-5 fw-bold">{{ titleText }}</h2>

    <button
      v-if="!gameStore.hasWon"
      class="btn btn-info mb-4"
      :disabled="gameStore.isLocked"
      @click="handleReplayPrompt"
    >
      {{ buttonText }}
    </button>

    <div v-if="!gameStore.hasWon" class="row justify-content-center g-4">
      <div
        v-for="animal in gameStore.currentQuestion?.options ?? []"
        :key="animal.key"
        class="col-6 col-md-3"
      >
        <AnimalOptionCard
          :disabled="gameStore.isLocked"
          :image="animal.image"
          :label="animalLabel(animal.key)"
          :state="optionState(animal.key)"
          @choose="checkAnswer(animal.key)"
        />
      </div>
    </div>

    <GameFeedbackBanner
      v-if="feedbackMessage && feedbackTone && !gameStore.hasWon"
      :message="feedbackMessage"
      :tone="feedbackTone"
    />

    <GameWinOverlay
      v-if="gameStore.hasWon"
      :image-alt="t('home.mascotAlt')"
      :title="winTitle"
      @close="goToGames"
      @play-again="resetGame"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AnimalOptionCard from '@/components/atoms/AnimalOptionCard.vue'
import GameFeedbackBanner from '@/components/molecules/GameFeedbackBanner.vue'
import GameWinOverlay from '@/components/organisms/GameWinOverlay.vue'
import { useActivitySessionTracker } from '@/composables/useActivitySessionTracker'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useAuthSession } from '@/composables/useAuthSession'
import { useGameScreenSession } from '@/composables/useGameScreenSession'
import { usePromptedGameFlow } from '@/composables/usePromptedGameFlow'
import { useQuizAnswerFlow } from '@/composables/useQuizAnswerFlow'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useAnimalSoundGameStore, type AnimalKey } from '@/stores/games/animal-sound'
import { launchCenteredConfetti } from '@/utils/game-effects'

const { t } = useI18n()
const { child } = useAuthSession()
const gameStore = useAnimalSoundGameStore()
const feedbackPlayer = useAudioPlayer()
const promptPlayer = useAudioPlayer()
const { prefersReducedMotion } = useReducedMotion()
const { cancel, speak } = useSpeechSynthesis()
const activityTracker = useActivitySessionTracker()
const { goToGames } = useGameScreenSession([cancel, feedbackPlayer.stop, promptPlayer.stop])
const questionStartedAt = ref(0)
const questionAttemptCount = ref(0)
const questionReplayCount = ref(0)
const responseSequence = ref(0)

const childName = computed(() => child.value?.name?.trim() || 'peque')
const titleText = computed(() => t('games.animals.title'))
const buttonText = computed(() => t('games.animals.button'))
const feedbackCorrect = computed(() => t('games.animals.feedback.correct', { name: childName.value }))
const feedbackWrong = computed(() => t('games.animals.feedback.wrong'))
const winTitle = computed(() => t('games.animals.winTitle', { name: childName.value }))
const feedbackMessage = computed(() => {
  if (gameStore.result === 'correct') return feedbackCorrect.value
  if (gameStore.result === 'wrong') return feedbackWrong.value
  return ''
})
const feedbackTone = computed<'success' | 'error' | null>(() => {
  if (gameStore.result === 'correct') return 'success'
  if (gameStore.result === 'wrong') return 'error'
  return null
})

const { replayPrompt, restart } = usePromptedGameFlow({
  prompt: startQuestionPrompt,
  start: () => {
    gameStore.startGame()
    questionAttemptCount.value = 0
    void activityTracker.startSession({
      activityCode: 'animal-sound',
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
    responseSequence.value = 0
  },
})
const { submitAnswer } = useQuizAnswerFlow<AnimalKey>({
  beforeFinish: () => nextTick(),
  finishGame: () => {
    gameStore.finishGame()
  },
  goToNextQuestion: () => {
    gameStore.goToNextQuestion()
  },
  isLastQuestion: () => gameStore.isLastQuestion,
  markCorrect: (selected) => {
    gameStore.markCorrect(selected)
  },
  markWrong: (selected) => {
    gameStore.markWrong(selected)
  },
  onAdvance: replayPrompt,
  onCorrect: async () => {
    await playFeedback('correct')
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
        particleCount: 180,
        spread: 90,
        startVelocity: 45,
      })
    }
    speak(t('common.messages.congrats'))
  },
  onWrong: async () => {
    await playFeedback('wrong')
  },
  resetFeedback: () => {
    gameStore.resetFeedback()
  },
})

function animalLabel(key: AnimalKey) {
  return t(`games.animals.names.${key}`)
}

function optionState(key: AnimalKey) {
  if (!gameStore.currentQuestion) return null

  if (gameStore.result === 'correct' && key === gameStore.currentQuestion.answer) {
    return 'correct'
  }

  if (gameStore.result === 'wrong' && key === gameStore.selectedOption) {
    return 'wrong'
  }

  return null
}

async function playPromptSound() {
  if (!gameStore.currentQuestion) return
  await promptPlayer.play(gameStore.currentQuestion.sound)
}

async function startQuestionPrompt() {
  questionStartedAt.value = Date.now()
  questionAttemptCount.value = 0
  questionReplayCount.value = 0
  await playPromptSound()
}

async function handleReplayPrompt() {
  if (!gameStore.currentQuestion || gameStore.isLocked) return

  questionReplayCount.value += 1
  activityTracker.trackEvent({
    type: 'audio_replayed',
    payload: {
      answer: gameStore.currentQuestion.answer,
      replayCount: questionReplayCount.value,
      sequence: gameStore.index + 1,
      sound: gameStore.currentQuestion.sound,
    },
  })

  await playPromptSound()
}

async function checkAnswer(selected: AnimalKey) {
  if (!gameStore.currentQuestion || gameStore.isLocked) return

  const currentQuestion = gameStore.currentQuestion
  const isCorrect = selected === currentQuestion.answer
  questionAttemptCount.value += 1
  responseSequence.value += 1

  activityTracker.trackResponse({
    sequence: responseSequence.value,
    promptType: 'animal_sound',
    prompt: {
      options: currentQuestion.options.map((animal) => animal.key),
      sound: currentQuestion.sound,
    },
    expected: {
      animal: currentQuestion.answer,
    },
    answer: {
      animal: selected,
    },
    attemptNumber: questionAttemptCount.value,
    isCorrect,
    reactionMs: Math.max(0, Date.now() - questionStartedAt.value),
    audioReplayCount: questionReplayCount.value,
    metadata: {
      questionIndex: gameStore.index + 1,
      sound: currentQuestion.sound,
    },
  })

  await submitAnswer(selected, isCorrect)
}

function resetGame() {
  void restart()
}

async function playFeedback(type: 'correct' | 'wrong') {
  const src = type === 'correct' ? '/sounds/true.mp3' : '/sounds/error.mp3'
  const text = type === 'correct' ? feedbackCorrect.value : feedbackWrong.value
  const played = await feedbackPlayer.play(src, { waitForEnd: true })

  if (!played) {
    speak(text)
  }
}
</script>
