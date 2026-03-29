<template>
  <NuxtLink
    :to="to"
    class="game-card"
    :class="{ 'is-active': isActive }"
    :aria-current="isActive ? 'page' : undefined"
  >
    <div class="game-card__image-wrapper">
      <img :src="image" :alt="alt" class="game-card__image" />
    </div>
    <div class="game-card__content">
      <h3 class="game-card__title">{{ title }}</h3>
      <p class="game-card__description">{{ description }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useRouteTargetState } from '@/composables/useRouteMatcher'

const props = defineProps<{
  alt: string
  description: string
  image: string
  title: string
  to: string
}>()

const { isActive } = useRouteTargetState(toRef(props, 'to'))
</script>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: none;
  border-radius: 24px;
  text-decoration: none;
  background: #ffffff;
  border: 2px solid transparent;
  box-shadow: 0 16px 32px rgba(25, 41, 70, 0.14);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.game-card:is(:hover, :focus-visible) {
  transform: translateY(-6px);
  box-shadow: 0 22px 42px rgba(25, 41, 70, 0.22);
}

.game-card:focus-visible {
  outline: 4px solid rgba(13, 110, 253, 0.22);
  outline-offset: 5px;
}

.game-card.is-active {
  border-color: rgba(13, 110, 253, 0.4);
  box-shadow: 0 20px 38px rgba(13, 110, 253, 0.16);
}

.game-card__image-wrapper {
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: linear-gradient(180deg, #fff6da 0%, #f6fbff 100%);
}

.game-card__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.game-card__content {
  display: grid;
  gap: 0.45rem;
  padding: 1rem 1rem 1.15rem;
  color: #17324d;
}

.game-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.game-card__description {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #4b6079;
}

@media (prefers-reduced-motion: reduce) {
  .game-card {
    transition: none;
  }

  .game-card:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
