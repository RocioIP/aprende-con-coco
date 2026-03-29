<template>
  <button
    type="button"
    class="flag-button"
    :class="{ active }"
    :aria-label="label"
    :title="label"
    v-bind="$attrs"
  >
    <span class="flag" :class="['fi', flagClass]" aria-hidden="true"></span>
    <span class="sr-only">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  active?: boolean
  flagClass: string
  label: string
}>()
</script>

<style scoped>
.flag-button {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.flag {
  --fi-size: 1.7rem;
}

.flag-button:focus-visible {
  outline: 3px solid rgba(13, 110, 253, 0.28);
  outline-offset: 4px;
  border-radius: 999px;
}

.flag-button.active {
  transform: scale(1.05);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .flag-button {
    transition: none;
  }
}
</style>
