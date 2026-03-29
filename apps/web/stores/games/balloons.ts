import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const BOARD_HEIGHT = 900
const CLUSTER_PADDING_TOP = 80
const CLUSTER_HEIGHT = 520
const CLUSTER_WIDTH_RATIO = 0.85
const BALLOON_MARGIN = 12

export const BALLOON_VOWELS = ['A', 'E', 'I', 'O', 'U'] as const
export const BALLOON_SIZES = ['grande', 'pequeno'] as const
export const BALLOON_COLOR_BY_VOWEL = {
  A: '#FF6B6B',
  E: '#FFD93D',
  I: '#4D96FF',
  O: '#6BCB77',
  U: '#FF8000',
} as const
export const BALLOON_COLOR_KEY_BY_HEX = {
  '#FF6B6B': 'red',
  '#FFD93D': 'yellow',
  '#4D96FF': 'blue',
  '#6BCB77': 'green',
  '#FF8000': 'orange',
} as const
export const BALLOON_SIZE_KEY_MAP = {
  grande: 'large',
  pequeno: 'small',
} as const

export type BalloonLevel = 1 | 2
export type BalloonLetter = (typeof BALLOON_VOWELS)[number]
export type BalloonSize = (typeof BALLOON_SIZES)[number]
export type BalloonColor = (typeof BALLOON_COLOR_BY_VOWEL)[BalloonLetter]
export type BalloonColorKey = (typeof BALLOON_COLOR_KEY_BY_HEX)[BalloonColor]

export interface BalloonItem {
  color: BalloonColor
  id: string
  letter: BalloonLetter
  size: BalloonSize
  x: number
  y: number
}

export type BalloonSelectionOutcome = 'correct' | 'wrong' | 'won' | 'ignored'

function getBalloonDimensions(size: BalloonSize) {
  return size === 'pequeno'
    ? { h: 90, w: 75 }
    : { h: 120, w: 100 }
}

function createBalloonLayout(level: BalloonLevel, boardWidth: number) {
  const safeBoardWidth = boardWidth || 900
  const clusterWidth = safeBoardWidth * CLUSTER_WIDTH_RATIO
  const clusterHeight = Math.min(CLUSTER_HEIGHT, BOARD_HEIGHT - CLUSTER_PADDING_TOP - 40)
  const clusterX = (safeBoardWidth - clusterWidth) / 2
  const clusterY = CLUSTER_PADDING_TOP
  const positions: Array<{ h: number; w: number; x: number; y: number }> = []
  const balloons: BalloonItem[] = []

  const isOverlapping = (x: number, y: number, w: number, h: number) =>
    positions.some(
      (position) =>
        Math.abs(position.x - x) < (position.w + w) / 2 + BALLOON_MARGIN &&
        Math.abs(position.y - y) < (position.h + h) / 2 + BALLOON_MARGIN
    )

  const placeBalloon = (size: BalloonSize) => {
    const { h, w } = getBalloonDimensions(size)
    let x = clusterX
    let y = clusterY
    let tries = 0
    const maxTries = level === 1 ? 200 : 300

    do {
      x = Math.random() * (clusterWidth - w) + clusterX
      y = Math.random() * (clusterHeight - h) + clusterY
      tries += 1
    } while (isOverlapping(x, y, w, h) && tries < maxTries)

    positions.push({ h, w, x, y })

    return { x, y }
  }

  if (level === 1) {
    BALLOON_VOWELS.forEach((letter, index) => {
      const size: BalloonSize = 'grande'
      const { x, y } = placeBalloon(size)

      balloons.push({
        color: BALLOON_COLOR_BY_VOWEL[letter],
        id: `L1-${index}`,
        letter,
        size,
        x,
        y,
      })
    })

    return balloons
  }

  let id = 0
  BALLOON_VOWELS.forEach((letter) => {
    BALLOON_SIZES.forEach((size) => {
      const { x, y } = placeBalloon(size)

      balloons.push({
        color: BALLOON_COLOR_BY_VOWEL[letter],
        id: `L2-${id}`,
        letter,
        size,
        x,
        y,
      })

      id += 1
    })
  })

  return balloons
}

export const useBalloonsGameStore = defineStore('game-balloons', () => {
  const level = ref<BalloonLevel>(1)
  const balloons = ref<BalloonItem[]>([])
  const targetId = ref<string | null>(null)
  const hasWon = ref(false)

  const currentTarget = computed(
    () => balloons.value.find((balloon) => balloon.id === targetId.value) ?? null
  )

  function pickNextTarget() {
    if (balloons.value.length === 0) {
      targetId.value = null
      hasWon.value = true
      return
    }

    const randomIndex = Math.floor(Math.random() * balloons.value.length)
    targetId.value = balloons.value[randomIndex]?.id ?? null
  }

  function startGame(boardWidth: number) {
    hasWon.value = false
    balloons.value = createBalloonLayout(level.value, boardWidth)
    pickNextTarget()
  }

  function restart(boardWidth: number) {
    startGame(boardWidth)
  }

  function setLevel(nextLevel: BalloonLevel, boardWidth: number) {
    if (level.value === nextLevel) return

    level.value = nextLevel
    startGame(boardWidth)
  }

  function resolveSelection(id: string): BalloonSelectionOutcome {
    if (hasWon.value || !currentTarget.value) return 'ignored'
    if (id !== currentTarget.value.id) return 'wrong'

    balloons.value = balloons.value.filter((balloon) => balloon.id !== id)

    if (balloons.value.length === 0) {
      targetId.value = null
      hasWon.value = true
      return 'won'
    }

    pickNextTarget()
    return 'correct'
  }

  return {
    balloons,
    currentTarget,
    hasWon,
    level,
    restart,
    resolveSelection,
    setLevel,
    startGame,
    targetId,
  }
})
