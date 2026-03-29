import { defineStore } from 'pinia'
import { sampleUnique, shuffle } from '@/utils/random'
import { createQuizGameStore } from '@/stores/games/shared/createQuizGameStore'

const QUESTIONS_PER_ROUND = 5
const OPTIONS_PER_QUESTION = 2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export interface LetterQuestion {
  answer: string
  letter: string
  options: string[]
}

function createLettersRound(): LetterQuestion[] {
  const letters = sampleUnique(ALPHABET, QUESTIONS_PER_ROUND)

  return shuffle(
    letters.map((letter) => {
      const distractors = sampleUnique(
        ALPHABET.filter((item) => item !== letter),
        OPTIONS_PER_QUESTION - 1
      )

      return {
        answer: letter,
        letter,
        options: shuffle([letter, ...distractors]),
      }
    })
  )
}

export const useLettersGameStore = defineStore('game-letters', () =>
  createQuizGameStore<LetterQuestion, string>({
    createRound: createLettersRound,
  })
)
