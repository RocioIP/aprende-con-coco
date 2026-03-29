<template>
  <ul class="navbar-nav">
    <li v-for="item in navigationStore.headerItems" :key="item.id" class="nav-item">
      <NuxtLink
        class="nav-link"
        :class="{ 'is-active': isActiveRoute(item.to) }"
        :to="item.to"
        :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
      >
        {{ t(item.labelKey) }}
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouteMatcher } from '@/composables/useRouteMatcher'
import { useNavigationStore } from '@/stores/content/navigation'

const navigationStore = useNavigationStore()
const { t } = useI18n()
const { matches: isActiveRoute } = useRouteMatcher()
</script>

<style scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.8rem !important;
  border-radius: 999px;
  font-weight: 500;
  font-size: clamp(1.18rem, 1.34vw, 1.38rem);
  transition: color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.nav-link:is(:hover, :focus-visible) {
  color: #0d6efd !important;
  background: rgba(13, 110, 253, 0.1);
}

.nav-link:focus-visible {
  outline: 3px solid rgba(13, 110, 253, 0.24);
  outline-offset: 3px;
}

.nav-link.is-active {
  color: #0d6efd !important;
  background: rgba(13, 110, 253, 0.14);
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .nav-link {
    transition: none;
  }

  .nav-link.is-active,
  .nav-link:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
