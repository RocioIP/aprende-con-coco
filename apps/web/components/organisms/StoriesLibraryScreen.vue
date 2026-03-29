<template>
  <section class="stories-screen" :class="{ 'stories-screen--reader': selectedStory }">
    <template v-if="selectedStory">
      <StoryBookReader
        :story="selectedStory"
        :page-index="storiesStore.currentPageIndex"
        :transition-name="transitionName"
        @close="closeStory"
        @next="goToNextPage"
        @previous="goToPreviousPage"
      />
    </template>

    <template v-else>
      <div class="stories-screen__hero">
        <div class="stories-screen__copy">
          <span class="stories-screen__eyebrow">{{ t('stories.index.eyebrow') }}</span>
          <h1 class="stories-screen__title">{{ t('stories.index.title') }}</h1>
        </div>
      </div>

      <div class="stories-screen__grid">
        <StoryLibraryCard
          v-for="story in localizedStories"
          :key="story.id"
          :story="story"
          @open="openStory"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StoryLibraryCard from '@/components/molecules/StoryLibraryCard.vue'
import StoryBookReader from '@/components/organisms/StoryBookReader.vue'
import { getLocalizedStories, getLocalizedStory } from '@/content/stories'
import { useStoriesLibraryStore } from '@/stores/stories/library'
import type { StoryId } from '@/types/stories'

const { t, locale } = useI18n()
const storiesStore = useStoriesLibraryStore()
const transitionName = ref<'story-slide-next' | 'story-slide-previous'>('story-slide-next')

const localizedStories = computed(() => getLocalizedStories(locale.value))
const selectedStory = computed(() => {
  if (!storiesStore.selectedStoryId) return null
  return getLocalizedStory(storiesStore.selectedStoryId, locale.value)
})

function openStory(storyId: StoryId) {
  transitionName.value = 'story-slide-next'
  storiesStore.openStory(storyId)
}

function closeStory() {
  storiesStore.closeStory()
}

function goToNextPage() {
  if (!selectedStory.value) return

  transitionName.value = 'story-slide-next'
  storiesStore.nextPage(selectedStory.value.pages.length)
}

function goToPreviousPage() {
  transitionName.value = 'story-slide-previous'
  storiesStore.previousPage()
}
</script>

<style scoped>
.stories-screen {
  min-height: calc(100dvh - 6rem);
  padding: 1.5rem 1rem 2rem;
  background:
    radial-gradient(circle at top left, rgba(255, 241, 219, 0.85), transparent 28%),
    radial-gradient(circle at top right, rgba(219, 233, 255, 0.75), transparent 30%),
    #f8fbff;
}

.stories-screen--reader {
  padding: 0.9rem 1rem 1rem;
}

.stories-screen__hero {
  width: min(100%, 72rem);
  margin: 0 auto 1.6rem;
}

.stories-screen__copy {
  max-width: 72rem;
}

.stories-screen__eyebrow {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #587090;
  font-size: 0.95rem;
  font-weight: 700;
}

.stories-screen__title {
  margin: 0.9rem 0 0;
  color: #1d3250;
  font-size: clamp(1.9rem, 2.7vw, 3rem);
  white-space: nowrap;
}

.stories-screen__grid {
  width: min(100%, 72rem);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(18rem, 1fr));
  gap: 1.25rem;
}

@media (max-width: 980px) {
  .stories-screen__title {
    white-space: normal;
  }
}

@media (max-width: 780px) {
  .stories-screen {
    padding-top: 1.2rem;
  }

  .stories-screen--reader {
    padding-top: 0.75rem;
  }

  .stories-screen__grid {
    grid-template-columns: 1fr;
    max-width: 32rem;
  }
}
</style>
