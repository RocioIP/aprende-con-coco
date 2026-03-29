<template>
  <div
    class="game-feedback-banner"
    :class="{
      'is-success': tone === 'success',
      'is-error': tone === 'error',
    }"
    role="status"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  tone: 'error' | 'success'
}>()
</script>

<style scoped>
.game-feedback-banner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: min(100%, 280px);
  margin-top: 1.5rem;
  padding: 0.9rem 1.4rem;
  border-radius: 999px;
  border: 2px solid transparent;
  font-size: clamp(1.1rem, 2.8vw, 1.5rem);
  font-weight: 800;
  letter-spacing: 0.01em;
}

.game-feedback-banner.is-success {
  color: #0f5132;
  background: #d1e7dd;
  border-color: #8fd3ac;
}

.game-feedback-banner.is-error {
  color: #842029;
  background: #f8d7da;
  border-color: #e9a5ad;
}
</style>
