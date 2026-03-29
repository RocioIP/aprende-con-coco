import { computed, ref } from 'vue'

export type QuizResult = 'correct' | 'wrong' | null

interface CreateQuizGameStoreOptions<TQuestion, TOption> {
  createRound: () => TQuestion[]
}

export function createQuizGameStore<TQuestion, TOption>({
  createRound,
}: CreateQuizGameStoreOptions<TQuestion, TOption>) {
  const questions = ref<TQuestion[]>([])
  const index = ref(0)
  const selectedOption = ref<TOption | null>(null)
  const result = ref<QuizResult>(null)
  const isLocked = ref(false)
  const hasWon = ref(false)

  const currentQuestion = computed<TQuestion | null>(() => questions.value[index.value] ?? null)
  const isLastQuestion = computed(
    () => questions.value.length > 0 && index.value === questions.value.length - 1
  )

  function resetFeedback() {
    selectedOption.value = null
    result.value = null
    isLocked.value = false
  }

  function startGame() {
    questions.value = createRound()
    index.value = 0
    hasWon.value = false
    resetFeedback()
  }

  function markCorrect(option: TOption) {
    selectedOption.value = option
    result.value = 'correct'
    isLocked.value = true
  }

  function markWrong(option: TOption) {
    selectedOption.value = option
    result.value = 'wrong'
    isLocked.value = true
  }

  function goToNextQuestion() {
    if (isLastQuestion.value) return

    index.value += 1
    resetFeedback()
  }

  function finishGame() {
    hasWon.value = true
  }

  return {
    currentQuestion,
    finishGame,
    goToNextQuestion,
    hasWon,
    index,
    isLastQuestion,
    isLocked,
    markCorrect,
    markWrong,
    questions,
    resetFeedback,
    result,
    selectedOption,
    startGame,
  }
}
