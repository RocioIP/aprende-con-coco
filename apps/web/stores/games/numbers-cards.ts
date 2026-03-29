import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { sampleUnique } from '@/utils/random'

const ROUND_SIZE = 3
const MAX_ROUNDS = 3
const NUMBER_POOL = Array.from({ length: 10 }, (_, index) => index + 1)

export type NumbersQuizResult = 'correct' | 'wrong' | null
export type NumbersAdvanceOutcome = 'next-turn' | 'next-round' | 'finished'

export interface NumberCardItem {
  flipped: boolean
  id: string
  shake: boolean
  value: number
}

function createRoundCards(roundIndex: number): NumberCardItem[] {
  return sampleUnique(NUMBER_POOL, ROUND_SIZE).map((value, index) => ({
    flipped: false,
    id: `round-${roundIndex}-card-${index}`,
    shake: false,
    value,
  }))
}

export const useNumbersCardsGameStore = defineStore('game-numbers-cards', () => {
  const cards = ref<NumberCardItem[]>([])
  const targetNumber = ref<number | null>(null)
  const roundIndex = ref(1)
  const result = ref<NumbersQuizResult>(null)
  const selectedValue = ref<number | null>(null)
  const isLocked = ref(false)
  const finished = ref(false)

  const remainingCards = computed(() => cards.value.filter((card) => !card.flipped))
  const isLastRound = computed(() => roundIndex.value >= MAX_ROUNDS)

  function pickNextTarget() {
    if (remainingCards.value.length === 0) {
      targetNumber.value = null
      return
    }

    const randomIndex = Math.floor(Math.random() * remainingCards.value.length)
    targetNumber.value = remainingCards.value[randomIndex]?.value ?? null
  }

  function resetFeedback() {
    result.value = null
    selectedValue.value = null
    isLocked.value = false
    cards.value = cards.value.map((card) => ({
      ...card,
      shake: false,
    }))
  }

  function startRound() {
    cards.value = createRoundCards(roundIndex.value)
    resetFeedback()
    pickNextTarget()
  }

  function startGame() {
    roundIndex.value = 1
    finished.value = false
    startRound()
  }

  function markCorrect(value: number) {
    selectedValue.value = value
    result.value = 'correct'
    isLocked.value = true
    cards.value = cards.value.map((card) =>
      card.value === value ? { ...card, flipped: true } : card
    )
  }

  function markWrong(value: number) {
    selectedValue.value = value
    result.value = 'wrong'
    isLocked.value = true
    cards.value = cards.value.map((card) =>
      card.value === value ? { ...card, shake: true } : card
    )
  }

  function completeTurn(): NumbersAdvanceOutcome {
    if (remainingCards.value.length > 0) {
      resetFeedback()
      pickNextTarget()
      return 'next-turn'
    }

    if (isLastRound.value) {
      finished.value = true
      return 'finished'
    }

    roundIndex.value += 1
    startRound()
    return 'next-round'
  }

  return {
    cards,
    completeTurn,
    finished,
    isLastRound,
    isLocked,
    markCorrect,
    markWrong,
    maxRounds: MAX_ROUNDS,
    remainingCards,
    resetFeedback,
    result,
    roundIndex,
    selectedValue,
    startGame,
    startRound,
    targetNumber,
  }
})
