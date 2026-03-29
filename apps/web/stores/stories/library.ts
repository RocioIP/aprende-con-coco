import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { StoryId } from '@/types/stories'

export const useStoriesLibraryStore = defineStore('stories-library', () => {
  const selectedStoryId = ref<StoryId | null>(null)
  const currentPageIndex = ref(0)

  const hasOpenStory = computed(() => selectedStoryId.value !== null)

  function openStory(storyId: StoryId) {
    selectedStoryId.value = storyId
    currentPageIndex.value = 0
  }

  function closeStory() {
    selectedStoryId.value = null
    currentPageIndex.value = 0
  }

  function nextPage(pageCount: number) {
    if (currentPageIndex.value >= pageCount - 1) return false

    currentPageIndex.value += 1
    return true
  }

  function previousPage() {
    if (currentPageIndex.value <= 0) return false

    currentPageIndex.value -= 1
    return true
  }

  function goToPage(index: number, pageCount: number) {
    if (index < 0 || index >= pageCount) return
    currentPageIndex.value = index
  }

  return {
    selectedStoryId,
    currentPageIndex,
    hasOpenStory,
    openStory,
    closeStory,
    nextPage,
    previousPage,
    goToPage,
  }
})
