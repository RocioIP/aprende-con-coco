import { defineStore } from 'pinia'
import { sampleUnique, shuffle } from '@/utils/random'
import { createQuizGameStore } from '@/stores/games/shared/createQuizGameStore'

const QUESTIONS_PER_ROUND = 5

export const ANIMALS = [
  { key: 'lion', sound: '/sounds/animals/lion.mp3', image: '/images/games/animals/lion.webp' },
  { key: 'dog', sound: '/sounds/animals/dog.mp3', image: '/images/games/animals/dog.webp' },
  { key: 'cat', sound: '/sounds/animals/cat.mp3', image: '/images/games/animals/cat.webp' },
  { key: 'duck', sound: '/sounds/animals/duck.mp3', image: '/images/games/animals/duck.webp' },
  { key: 'rooster', sound: '/sounds/animals/rooster.mp3', image: '/images/games/animals/rooster.webp' },
] as const

export type AnimalKey = (typeof ANIMALS)[number]['key']
export interface AnimalOption {
  image: string
  key: AnimalKey
}

export interface AnimalQuestion {
  answer: AnimalKey
  options: AnimalOption[]
  sound: string
}

function createAnimalRound(): AnimalQuestion[] {
  return shuffle(
    sampleUnique(ANIMALS, QUESTIONS_PER_ROUND).map((target) => {
      const [distractor] = sampleUnique(
        ANIMALS.filter((animal) => animal.key !== target.key),
        1
      )

      return {
        answer: target.key,
        options: shuffle([
          { key: target.key, image: target.image },
          { key: distractor?.key ?? target.key, image: distractor?.image ?? target.image },
        ]),
        sound: target.sound,
      }
    })
  )
}

export const useAnimalSoundGameStore = defineStore('game-animal-sound', () =>
  createQuizGameStore<AnimalQuestion, AnimalKey>({
    createRound: createAnimalRound,
  })
)
