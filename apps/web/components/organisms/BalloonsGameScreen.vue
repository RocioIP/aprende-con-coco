<template>
  <div ref="containerEl" class="game-container">
    <div class="topbar">
      <GameLevelSelector
        :disabled="isResolving"
        :options="levelOptions"
        :selected="gameStore.level"
        @select="onLevelSelect"
      />
    </div>

    <h3 v-if="!gameStore.hasWon" class="display-6 fw-bold text-center mt-3">
      {{ t('games.balloons.instruction') }}
      <span
        v-if="gameStore.currentTarget"
        :style="{ color: gameStore.currentTarget.color, fontWeight: 'bold' }"
      >
        {{ targetColorLabel }}
      </span>
      <span v-if="gameStore.level === 2 && gameStore.currentTarget" class="badge-size">
        {{ targetSizeLabel }}
      </span>
    </h3>

    <div ref="boardEl" class="balloons-board position-relative mx-auto">
      <BalloonBubble
        v-for="balloon in gameStore.balloons"
        :key="balloon.id"
        :color="balloon.color"
        :disabled="isResolving"
        :id="balloon.id"
        :is-shaking="shakingBalloonId === balloon.id"
        :letter="balloon.letter"
        :size="balloon.size"
        :x="balloon.x"
        :y="balloon.y"
        @select="onSelect"
      />
    </div>

    <GameWinOverlay
      v-if="gameStore.hasWon"
      :image-alt="t('home.mascotAlt')"
      :title="t('common.messages.congrats')"
      @close="goToGames"
      @play-again="resetGame"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BalloonBubble from '@/components/atoms/BalloonBubble.vue'
import { useActivitySessionTracker } from '@/composables/useActivitySessionTracker'
import GameLevelSelector from '@/components/molecules/GameLevelSelector.vue'
import GameWinOverlay from '@/components/organisms/GameWinOverlay.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useGameScreenSession } from '@/composables/useGameScreenSession'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import {
  BALLOON_COLOR_KEY_BY_HEX,
  BALLOON_SIZE_KEY_MAP,
  useBalloonsGameStore,
  type BalloonLevel,
} from '@/stores/games/balloons'
import { launchCenteredConfetti, launchPointConfetti, wait } from '@/utils/game-effects'

const WRONG_FEEDBACK_MS = 450

const { t } = useI18n()
const gameStore = useBalloonsGameStore()
const effectsPlayer = useAudioPlayer()
const { prefersReducedMotion } = useReducedMotion()
const { cancel, speak } = useSpeechSynthesis()
const activityTracker = useActivitySessionTracker()
const { goToGames } = useGameScreenSession([cancel, effectsPlayer.stop])

const boardEl = ref<HTMLDivElement | null>(null)
const containerEl = ref<HTMLDivElement | null>(null)
const shakingBalloonId = ref<string | null>(null)
const isResolving = ref(false)
const responseSequence = ref(0)
const targetAttemptCount = ref(0)
const targetStartedAt = ref(0)

const levelOptions = computed(() => [
  { label: t('games.balloons.levelOne'), value: 1 },
  { label: t('games.balloons.levelTwo'), value: 2 },
])

const targetColorLabel = computed(() => {
  const color = gameStore.currentTarget?.color
  if (!color) return ''

  const key = BALLOON_COLOR_KEY_BY_HEX[color]
  return key ? t(`games.balloons.colors.${key}`) : ''
})

const targetSizeLabel = computed(() => {
  const size = gameStore.currentTarget?.size
  if (!size) return ''

  return t(`games.balloons.sizes.${BALLOON_SIZE_KEY_MAP[size]}`)
})

onMounted(async () => {
  await initializeGame()
})

async function initializeGame() {
  await nextTick()
  gameStore.startGame(measureBoardWidth())
  await startTrackedSession('initial')
}

async function onLevelSelect(value: number | string) {
  if (isResolving.value) return

  const nextLevel = Number(value) as BalloonLevel
  const previousLevel = gameStore.level
  if (previousLevel === nextLevel) return

  activityTracker.trackEvent({
    type: 'difficulty_changed',
    payload: {
      fromLevel: previousLevel,
      toLevel: nextLevel,
    },
  })
  await activityTracker.abandonSession({
    fromLevel: previousLevel,
    reason: 'level_changed',
    toLevel: nextLevel,
  })

  shakingBalloonId.value = null
  gameStore.setLevel(nextLevel, measureBoardWidth())
  await startTrackedSession('level_changed')
}

async function onSelect(payload: { center: { x: number; y: number } | null; id: string }) {
  if (isResolving.value) return

  const selectedBalloon = gameStore.balloons.find((balloon) => balloon.id === payload.id)
  const currentTarget = gameStore.currentTarget
  const outcome = gameStore.resolveSelection(payload.id)

  if (outcome === 'ignored') return

  targetAttemptCount.value += 1
  responseSequence.value += 1

  activityTracker.trackResponse({
    sequence: responseSequence.value,
    promptType: 'balloon_target',
    prompt: {
      level: gameStore.level,
      targetColor: currentTarget?.color ?? null,
      targetLetter: currentTarget?.letter ?? null,
      targetSize: currentTarget?.size ?? null,
    },
    expected: {
      id: currentTarget?.id ?? null,
      color: currentTarget?.color ?? null,
      letter: currentTarget?.letter ?? null,
      size: currentTarget?.size ?? null,
    },
    answer: {
      id: selectedBalloon?.id ?? payload.id,
      color: selectedBalloon?.color ?? null,
      letter: selectedBalloon?.letter ?? null,
      size: selectedBalloon?.size ?? null,
    },
    attemptNumber: targetAttemptCount.value,
    isCorrect: outcome === 'correct' || outcome === 'won',
    reactionMs: Math.max(0, Date.now() - targetStartedAt.value),
    metadata: {
      level: gameStore.level,
    },
  })

  if (outcome === 'wrong') {
    isResolving.value = true
    shakingBalloonId.value = payload.id

    await Promise.all([
      wait(WRONG_FEEDBACK_MS),
      effectsPlayer.play('/sounds/error.mp3', { waitForEnd: true }),
    ])

    shakingBalloonId.value = null
    isResolving.value = false
    return
  }

  if (payload.center && !prefersReducedMotion.value) {
    launchPointConfetti(payload.center, {
      particleCount: 70,
      spread: 60,
      startVelocity: 35,
      ticks: 120,
    })
  }

  effectsPlayer.play('/sounds/pop.mp3')

  if (outcome === 'won') {
    activityTracker.trackEvent({
      type: 'session_completed',
      payload: {
        level: gameStore.level,
      },
    })
    void activityTracker.finishSession({
      status: 'completed',
      difficultyEnd: gameStore.level,
      metadata: {
        level: gameStore.level,
      },
    })

    if (!prefersReducedMotion.value) {
      launchCenteredConfetti({
        particleCount: 220,
        spread: 100,
        startVelocity: 45,
      })
    }
    speak(t('common.messages.congrats'))
    return
  }

  primeTargetTracking()
  speakInstruction()
}

function resetGame() {
  shakingBalloonId.value = null
  isResolving.value = false
  gameStore.restart(measureBoardWidth())
  void startTrackedSession('restart')
}

function speakInstruction() {
  const target = gameStore.currentTarget
  if (!target) return

  if (gameStore.level === 1) {
    speak(
      t('games.balloons.speakColor', {
        color: targetColorLabel.value,
      })
    )
    return
  }

  speak(
    t('games.balloons.speakColorSize', {
      color: targetColorLabel.value,
      size: targetSizeLabel.value,
    })
  )
}

function measureBoardWidth() {
  return boardEl.value?.getBoundingClientRect().width || Math.min(window.innerWidth, 900)
}

function primeTargetTracking() {
  targetAttemptCount.value = 0
  targetStartedAt.value = Date.now()
}

async function startTrackedSession(reason: 'initial' | 'level_changed' | 'restart') {
  responseSequence.value = 0
  primeTargetTracking()
  scrollToTop()

  void activityTracker.startSession({
    activityCode: 'balloons',
    difficultyStart: gameStore.level,
    metadata: {
      balloonCount: gameStore.balloons.length,
      level: gameStore.level,
    },
  })
  activityTracker.trackEvent({
    type: 'session_started',
    payload: {
      balloonCount: gameStore.balloons.length,
      level: gameStore.level,
      reason,
    },
  })

  speakInstruction()
}

function scrollToTop() {
  containerEl.value?.scrollTo({ behavior: 'auto', top: 0 })
}
</script>

<style scoped>
.game-container {
  width: 100vw;
  min-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 2rem;
}

.topbar {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}

.badge-size {
  margin-left: 0.5rem;
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #f1f3f5;
  font-weight: 800;
  text-transform: capitalize;
}

.balloons-board {
  width: min(100%, 900px);
  min-height: 900px;
  margin: 1rem auto 2rem;
  position: relative;
}
</style>
