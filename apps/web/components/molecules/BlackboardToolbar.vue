<template>
  <div class="toolbar">
    <div class="palette" role="toolbar" :aria-label="paletteLabel">
      <BlackboardColorButton
        v-for="color in colors"
        :key="color.id"
        :active="color.value === selectedColor"
        :color="color.value"
        :label="color.label"
        @select="emit('selectColor', color.value)"
      />
    </div>

    <button
      type="button"
      class="clear-button"
      :disabled="!canClear"
      :aria-disabled="!canClear"
      @click="emit('clear')"
    >
      <span aria-hidden="true">🧽</span>
      <span>{{ clearLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import BlackboardColorButton from '@/components/atoms/BlackboardColorButton.vue'

interface ColorViewModel {
  id: string
  label: string
  value: string
}

defineProps<{
  canClear: boolean
  clearLabel: string
  colors: ColorViewModel[]
  paletteLabel: string
  selectedColor: string
}>()

const emit = defineEmits<{
  clear: []
  selectColor: [color: string]
}>()
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    opacity 0.18s ease;
}

.clear-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #1e293b;
}

.clear-button:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.55);
  outline-offset: 3px;
}

.clear-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .clear-button {
    transition: none;
  }

  .clear-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
