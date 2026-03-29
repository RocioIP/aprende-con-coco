<template>
  <button
    type="button"
    class="tool-button"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    @click="emit('select')"
  >
    <span class="tool-icon" aria-hidden="true">{{ icon }}</span>
    <span class="tool-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean
  icon: string
  label: string
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<style scoped>
.tool-button {
  display: grid;
  gap: 0.35rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95));
  color: #0f172a;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.tool-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.tool-button.is-active {
  border-color: rgba(22, 101, 52, 0.45);
  background:
    linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(220, 252, 231, 0.98));
  box-shadow:
    0 0 0 4px rgba(34, 197, 94, 0.12),
    0 14px 28px rgba(22, 101, 52, 0.14);
}

.tool-button:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.55);
  outline-offset: 3px;
}

.tool-icon {
  font-size: 1.45rem;
  line-height: 1;
}

.tool-label {
  font-size: 0.98rem;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .tool-button {
    transition: none;
  }

  .tool-button:hover {
    transform: none;
  }
}
</style>
