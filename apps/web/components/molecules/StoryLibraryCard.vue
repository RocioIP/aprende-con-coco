<template>
  <button
    type="button"
    class="story-card"
    :class="`theme-${story.theme}`"
    @click="emit('open', story.id)"
  >
    <div class="story-card__cover">
      <img :src="story.coverImage" :alt="story.coverAlt" />
    </div>

    <div class="story-card__content">
      <h2 class="story-card__title">{{ story.title }}</h2>
      <p class="story-card__summary">{{ story.summary }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { LocalizedStory, StoryId } from '@/types/stories'

defineProps<{
  story: LocalizedStory
}>()

const emit = defineEmits<{
  open: [storyId: StoryId]
}>()
</script>

<style scoped>
.story-card {
  display: grid;
  gap: 1.1rem;
  width: 100%;
  padding: 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  text-align: left;
  box-shadow: 0 18px 42px rgba(28, 45, 67, 0.14);
  transition:
    transform 0.26s ease,
    box-shadow 0.26s ease,
    border-color 0.26s ease;
  cursor: pointer;
}

.story-card__cover {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.55);
}

.story-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.story-card__content {
  display: grid;
  gap: 0.6rem;
}

.story-card__title {
  margin: 0;
  color: #1b2d46;
  font-size: clamp(1.4rem, 2vw, 1.8rem);
}

.story-card__summary {
  margin: 0;
  color: #41556f;
  font-size: 1rem;
  line-height: 1.5;
}

.story-card:is(:hover, :focus-visible) {
  transform: translateY(-2px);
  border-color: rgba(31, 75, 153, 0.18);
  box-shadow: 0 24px 46px rgba(28, 45, 67, 0.18);
}

.story-card:focus-visible {
  outline: 3px solid rgba(31, 75, 153, 0.28);
  outline-offset: 3px;
}

.theme-sunrise {
  background: linear-gradient(180deg, #fff2d8 0%, #ffe4c4 100%);
}

.theme-starlight {
  background: linear-gradient(180deg, #e7efff 0%, #dce7ff 100%);
}

@media (prefers-reduced-motion: reduce) {
  .story-card {
    transition: none;
  }

  .story-card:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
