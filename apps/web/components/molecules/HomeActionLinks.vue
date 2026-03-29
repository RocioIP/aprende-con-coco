<template>
  <div class="home-actions">
    <NuxtLink
      v-for="item in navigationStore.homeActions"
      :key="item.id"
      :to="item.to"
      class="home-action"
      :class="[toneClass(item.tone), { 'is-active': isActiveRoute(item.to) }]"
      :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
      @click="emit('navigate')"
    >
      <span class="home-action__icon" aria-hidden="true">{{ iconFor(item.id) }}</span>
      <span class="home-action__label">{{ t(item.labelKey) }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouteMatcher } from '@/composables/useRouteMatcher'
import { useNavigationStore } from '@/stores/content/navigation'
import type { NavigationItem, NavigationTone } from '@/types/navigation'

const emit = defineEmits<{
  navigate: []
}>()

const navigationStore = useNavigationStore()
const { t } = useI18n()
const { matches: isActiveRoute } = useRouteMatcher()

function toneClass(tone: NavigationTone) {
  return `tone-${tone}`
}

function iconFor(id: NavigationItem['id']) {
  if (id === 'games') return '🎮'
  if (id === 'stories') return '📚'
  if (id === 'progress') return '📈'
  return '🎨'
}
</script>

<style scoped>
.home-actions {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  width: min(100%, 22rem);
  height: min(23rem, calc(100dvh - 12rem));
  min-height: 0;
}

.home-action {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  justify-content: flex-start;
  min-height: 0;
  padding: 1.2rem 1.4rem;
  border-radius: 28px;
  text-decoration: none;
  color: #ffffff;
  font-size: clamp(1.24rem, 1.78vw, 1.62rem);
  font-weight: 700;
  text-align: left;
  box-shadow: 0 12px 25px rgba(24, 44, 76, 0.16);
  opacity: 0;
  transform: translateX(30px);
  animation: slide-in 1.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease, outline-color 0.2s ease;
}

.home-action:is(:hover, :focus-visible) {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(24, 44, 76, 0.22);
}

.home-action:focus-visible {
  outline: 4px solid rgba(255, 255, 255, 0.45);
  outline-offset: 4px;
}

.home-action.is-active {
  box-shadow:
    inset 0 0 0 3px rgba(255, 255, 255, 0.35),
    0 16px 30px rgba(24, 44, 76, 0.22);
}

.home-action:nth-child(1) {
  animation-delay: 1.35s;
}

.home-action:nth-child(2) {
  animation-delay: 2.05s;
}

.home-action:nth-child(3) {
  animation-delay: 2.75s;
}

.home-action__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 3.8rem;
  height: 3.8rem;
  font-size: 2.95rem;
  line-height: 1;
}

.home-action__label {
  line-height: 1.05;
}

.tone-warning {
  background: linear-gradient(135deg, #ffb71b 0%, #ff8c00 100%);
}

.tone-primary {
  background: linear-gradient(135deg, #1a8cff 0%, #0058d8 100%);
}

.tone-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #d73c54 100%);
}

@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }

  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 900px) {
  .home-actions {
    width: min(100%, 17rem);
    height: min(18.5rem, calc(100dvh - 11.5rem));
  }

  .home-action {
    gap: 0.9rem;
    padding: 1rem 1.05rem;
    font-size: 1.1rem;
  }

  .home-action__icon {
    width: 2.8rem;
    height: 2.8rem;
    font-size: 2.1rem;
  }
}

@media (max-width: 640px) {
  .home-actions {
    width: min(100%, 22rem);
    height: auto;
  }

  .home-action {
    min-height: 5.15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-action {
    animation: none;
    opacity: 1;
    transform: none;
    transition: none;
  }

  .home-action:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
