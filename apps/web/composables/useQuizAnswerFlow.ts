type MaybePromise = Promise<void> | void

interface UseQuizAnswerFlowOptions<TSelection> {
  beforeFinish?: () => MaybePromise
  finishGame: () => void
  goToNextQuestion: () => void
  isLastQuestion: () => boolean
  markCorrect: (selection: TSelection) => void
  markWrong: (selection: TSelection) => void
  onAdvance?: () => MaybePromise
  onCorrect?: (selection: TSelection) => MaybePromise
  onWin?: (selection: TSelection) => MaybePromise
  onWrong?: (selection: TSelection) => MaybePromise
  resetFeedback: () => void
}

export type QuizAnswerOutcome = 'advanced' | 'won' | 'wrong'

export function useQuizAnswerFlow<TSelection>({
  beforeFinish,
  finishGame,
  goToNextQuestion,
  isLastQuestion,
  markCorrect,
  markWrong,
  onAdvance,
  onCorrect,
  onWin,
  onWrong,
  resetFeedback,
}: UseQuizAnswerFlowOptions<TSelection>) {
  async function submitAnswer(
    selection: TSelection,
    isCorrect: boolean
  ): Promise<QuizAnswerOutcome> {
    if (isCorrect) {
      markCorrect(selection)
      await onCorrect?.(selection)

      if (isLastQuestion()) {
        await beforeFinish?.()
        finishGame()
        await onWin?.(selection)
        return 'won'
      }

      goToNextQuestion()
      await onAdvance?.()
      return 'advanced'
    }

    markWrong(selection)
    await onWrong?.(selection)
    resetFeedback()
    return 'wrong'
  }

  return {
    submitAnswer,
  }
}
