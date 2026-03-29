<template>
  <div class="container py-4 text-center">
    <div v-if="!gameStore.finished">
      <p class="round-indicator mb-2">{{ gameStore.roundIndex }} / {{ gameStore.maxRounds }}</p>

      <h2 class="display-6 fw-bold mb-1">
        {{ t('games.numbersCards.titleBeforeNumber') }}
        <span class="target-number">{{ gameStore.targetNumber }}</span>
        {{ t('games.numbersCards.titleAfterNumber') }}
      </h2>

      <div class="cards-grid">
        <NumberCard
          v-for="card in gameStore.cards"
          :key="card.id"
          :disabled="gameStore.isLocked"
          :flipped="card.flipped"
          :shake="card.shake"
          :value="card.value"
          @choose="onChoose"
        />
      </div>

      <div class="controls mt-3">
        <button class="btn btn-outline-primary btn-lg rounded-pill" type="button" @click="repeatQuestion">
          {{ t('common.buttons.repeat') }}
        </button>
        <button class="btn btn-light btn-lg rounded-pill ms-2" type="button" @click="goToGames">
          {{ t('common.buttons.close') }}
        </button>
      </div>
    </div>

    <GameWinOverlay
      v-else
      :image-alt="t('home.mascotAlt')"
      :message="t('common.messages.roundsComplete')"
      :title="t('common.messages.congrats')"
      @close="goToGames"
      @play-again="resetGame"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NumberCard from '@/components/atoms/NumberCard.vue'
import GameWinOverlay from '@/components/organisms/GameWinOverlay.vue'
import { useActivitySessionTracker } from '@/composables/useActivitySessionTracker'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useGameScreenSession } from '@/composables/useGameScreenSession'
import { usePromptedGameFlow } from '@/composables/usePromptedGameFlow'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useNumbersCardsGameStore } from '@/stores/games/numbers-cards'
import { wait } from '@/utils/game-effects'

const INITIAL_PROMPT_DELAY_MS = 200
const SUCCESS_FEEDBACK_MS = 700
const ERROR_FEEDBACK_MS = 500

const { t } = useI18n()
const gameStore = useNumbersCardsGameStore()
const feedbackPlayer = useAudioPlayer()
const { cancel, speak } = useSpeechSynthesis()
const activityTracker = useActivitySessionTracker()
const { goToGames } = useGameScreenSession([cancel, feedbackPlayer.stop])
const promptReplayCount = ref(0)
const responseSequence = ref(0)
const turnAttemptCount = ref(0)
const turnStartedAt = ref(0)

function syncTurnTracking() {
  turnAttemptCount.value = 0
  promptReplayCount.value = 0
  turnStartedAt.value = Date.now()
}

const { replayPrompt, restart } = usePromptedGameFlow({
  initialDelayMs: INITIAL_PROMPT_DELAY_MS,
  prompt: speakPrompt,
  start: () => {
    gameStore.startGame()
    responseSequence.value = 0
    syncTurnTracking()
    void activityTracker.startSession({
      activityCode: 'numbers-cards',
      difficultyStart: 1,
      metadata: {
        maxRounds: gameStore.maxRounds,
        roundSize: gameStore.cards.length,
      },
    })
    activityTracker.trackEvent({
      type: 'session_started',
      payload: {
        maxRounds: gameStore.maxRounds,
        roundSize: gameStore.cards.length,
      },
    })
  },
})

async function onChoose(value: number) {
  if (gameStore.isLocked || gameStore.targetNumber === null) return

  turnAttemptCount.value += 1
  responseSequence.value += 1
  const currentTarget = gameStore.targetNumber
  const currentCards = gameStore.cards.map((card) => card.value)
  const isCorrect = value === currentTarget

  activityTracker.trackResponse({
    sequence: responseSequence.value,
    promptType: 'number_choice',
    prompt: {
      options: currentCards,
      targetNumber: currentTarget,
    },
    expected: {
      number: currentTarget,
    },
    answer: {
      number: value,
    },
    attemptNumber: turnAttemptCount.value,
    audioReplayCount: promptReplayCount.value,
    isCorrect,
    reactionMs: Math.max(0, Date.now() - turnStartedAt.value),
    metadata: {
      roundIndex: gameStore.roundIndex,
      targetNumber: currentTarget,
    },
  })

  if (isCorrect) {
    gameStore.markCorrect(value)

    await Promise.all([
      wait(SUCCESS_FEEDBACK_MS),
      feedbackPlayer.play('/sounds/true.mp3', { waitForEnd: true }),
    ])

    const outcome = gameStore.completeTurn()

    if (outcome === 'finished') {
      activityTracker.trackEvent({
        type: 'session_completed',
        payload: {
          maxRounds: gameStore.maxRounds,
        },
      })
      void activityTracker.finishSession({
        status: 'completed',
        difficultyEnd: 1,
        metadata: {
          maxRounds: gameStore.maxRounds,
        },
      })
      speak(t('common.messages.greatJob'))
      return
    }

    syncTurnTracking()
    await replayPrompt()
    return
  }

  gameStore.markWrong(value)

  await Promise.all([
    wait(ERROR_FEEDBACK_MS),
    feedbackPlayer.play('/sounds/error.mp3', { waitForEnd: true }),
  ])

  gameStore.resetFeedback()
}

function repeatQuestion() {
  if (gameStore.isLocked || gameStore.targetNumber === null) return

  promptReplayCount.value += 1
  activityTracker.trackEvent({
    type: 'audio_replayed',
    payload: {
      replayCount: promptReplayCount.value,
      roundIndex: gameStore.roundIndex,
      targetNumber: gameStore.targetNumber,
    },
  })
  void replayPrompt()
}

function resetGame() {
  void restart()
}

function speakPrompt() {
  if (gameStore.targetNumber === null) return

  speak(t('games.numbersCards.speakPrompt', { number: gameStore.targetNumber }))
}
</script>

<style scoped>
.round-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.5rem;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  background: #fff4d6;
  color: #946200;
  font-weight: 800;
}

.target-number {
  display: inline-block;
  padding: 0.1em 0.35em;
  border-radius: 0.25em;
  background: #eaf3ff;
  color: #0d6efd;
  box-shadow: 0 1px 0 rgba(13, 110, 253, 0.06) inset, 0 0 0 2px rgba(13, 110, 253, 0.06);
  font-size: clamp(3rem, 8vw, 6rem);
  line-height: 1;
  font-weight: 900;
  vertical-align: middle;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  justify-items: center;
  gap: 24px;
  max-width: 1280px;
  margin: 2rem auto;
}

@media (max-width: 640px) {
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
