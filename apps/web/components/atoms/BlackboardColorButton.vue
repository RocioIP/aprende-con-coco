<template>
  <button
    type="button"
    class="color-button"
    :class="{ 'is-active': active }"
    :style="{ '--swatch-color': color }"
    :aria-label="label"
    :aria-pressed="active"
    @click="emit('select')"
  />
</template>

<script setup lang="ts">
defineProps<{
  active: boolean
  color: string
  label: string
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<style scoped>
.color-button {
  width: 40px;
  height: 40px;
  border: 2px solid #94a3b8;
  border-radius: 999px;
  background: var(--swatch-color);
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.color-button:hover {
  transform: translateY(-1px) scale(1.04);
}

.color-button.is-active {
  border-color: #0f172a;
  box-shadow:
    0 0 0 4px rgba(15, 23, 42, 0.14),
    0 6px 16px rgba(15, 23, 42, 0.2);
  transform: scale(1.08);
}

.color-button:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.55);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .color-button {
    transition: none;
  }

  .color-button:hover,
  .color-button.is-active {
    transform: none;
  }
}
</style>
