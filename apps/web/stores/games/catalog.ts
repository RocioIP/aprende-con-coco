import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { GAME_ROUTES } from '@/constants/routes'
import type { GameCatalogItem } from '@/types/games'

const GAME_CATALOG: GameCatalogItem[] = [
  {
    id: 'balloons',
    to: GAME_ROUTES.balloons,
    image: '/images/games/balloons.webp',
    titleKey: 'games.catalog.balloons.title',
    descriptionKey: 'games.catalog.balloons.description',
    altKey: 'games.catalog.balloons.alt',
  },
  {
    id: 'letters',
    to: GAME_ROUTES.letters,
    image: '/images/games/letters.webp',
    titleKey: 'games.catalog.letters.title',
    descriptionKey: 'games.catalog.letters.description',
    altKey: 'games.catalog.letters.alt',
  },
  {
    id: 'animalSound',
    to: GAME_ROUTES.animalSound,
    image: '/images/games/friends.webp',
    titleKey: 'games.catalog.animals.title',
    descriptionKey: 'games.catalog.animals.description',
    altKey: 'games.catalog.animals.alt',
  },
  {
    id: 'numbersCards',
    to: GAME_ROUTES.numbersCards,
    image: '/images/games/numbers.webp',
    titleKey: 'games.catalog.numbers.title',
    descriptionKey: 'games.catalog.numbers.description',
    altKey: 'games.catalog.numbers.alt',
  },
]

export const useGamesCatalogStore = defineStore('games-catalog', () => {
  const items = ref(GAME_CATALOG)
  const orderedItems = computed(() => items.value)

  return {
    items,
    orderedItems,
  }
})
