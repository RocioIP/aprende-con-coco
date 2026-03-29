import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { APP_ROUTES } from '@/constants/routes'
import type { NavigationItem } from '@/types/navigation'

const HEADER_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'games',
    to: APP_ROUTES.games,
    labelKey: 'common.nav.games',
    tone: 'warning',
  },
  {
    id: 'stories',
    to: APP_ROUTES.stories,
    labelKey: 'common.nav.stories',
    tone: 'primary',
  },
  {
    id: 'blackboard',
    to: APP_ROUTES.blackboard,
    labelKey: 'common.nav.blackboard',
    tone: 'danger',
  },
]

const HOME_ACTION_ITEMS = HEADER_NAVIGATION_ITEMS

export const useNavigationStore = defineStore('content-navigation', () => {
  const items = ref(HEADER_NAVIGATION_ITEMS)
  const headerItems = computed(() => items.value)
  const homeActions = computed(() => HOME_ACTION_ITEMS)

  return {
    items,
    headerItems,
    homeActions,
  }
})
