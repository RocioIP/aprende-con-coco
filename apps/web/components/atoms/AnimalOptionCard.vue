<template>
  <button
    class="animal-option-card"
    :class="{
      'is-correct': state === 'correct',
      'is-wrong': state === 'wrong',
    }"
    :disabled="disabled"
    :aria-label="label"
    type="button"
    @click="emit('choose')"
  >
    <img :src="image" :alt="label" class="animal-option-image" />
    <span class="animal-option-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
  image: string
  label: string
  state?: 'correct' | 'wrong' | null
}>()

const emit = defineEmits<{
  choose: []
}>()
</script>

<style scoped>
.animal-option-card {
  --card-bg: #fff7eb;
  --card-border: #f2d39b;
  --card-shadow: rgba(125, 84, 28, 0.16);
  --card-text: #5a3a0f;
  width: 100%;
  min-height: 100%;
  padding: 1rem;
  border: 3px solid var(--card-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.9), transparent 58%),
    linear-gradient(180deg, var(--card-bg), #fffef9);
  box-shadow: 0 14px 28px var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  color: var(--card-text);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.animal-option-card:not(:disabled):is(:hover, :focus-visible) {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 18px 32px rgba(125, 84, 28, 0.2);
}

.animal-option-card:focus-visible {
  outline: 4px solid rgba(13, 202, 240, 0.28);
  outline-offset: 4px;
}

.animal-option-card:disabled {
  cursor: default;
}

.animal-option-card.is-correct {
  --card-bg: #dcfce7;
  --card-border: #47b36a;
  --card-shadow: rgba(33, 105, 62, 0.2);
  --card-text: #125228;
}

.animal-option-card.is-wrong {
  --card-bg: #ffe1df;
  --card-border: #e35d5b;
  --card-shadow: rgba(151, 44, 42, 0.18);
  --card-text: #7e1f1d;
}

.animal-option-image {
  width: min(100%, 180px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
}

.animal-option-label {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 800;
  line-height: 1.1;
}

@media (prefers-reduced-motion: reduce) {
  .animal-option-card {
    transition: none;
  }

  .animal-option-card:not(:disabled):is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
