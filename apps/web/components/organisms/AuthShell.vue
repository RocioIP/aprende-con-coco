<template>
  <section class="auth-shell">
    <div class="auth-shell__card">
      <div class="auth-shell__copy">
        <span class="auth-shell__eyebrow">{{ eyebrow }}</span>
        <h1 class="auth-shell__title">{{ title }}</h1>
        <p class="auth-shell__description">{{ description }}</p>
      </div>

      <slot />

      <p class="auth-shell__switch">
        {{ switchLabel }}
        <NuxtLink :to="switchTo">{{ switchAction }}</NuxtLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  switchAction: string
  switchLabel: string
  switchTo: string
}>()
</script>

<style scoped>
.auth-shell {
  min-height: calc(100dvh - 6rem);
  display: grid;
  place-items: center;
  padding: 2rem 1rem 3rem;
  background:
    radial-gradient(circle at top left, rgba(255, 231, 189, 0.72), transparent 26%),
    radial-gradient(circle at top right, rgba(216, 232, 255, 0.72), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #f4f8ff 100%);
}

.auth-shell__card {
  width: min(100%, 29rem);
  padding: 1.5rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 48px rgba(28, 50, 80, 0.12);
}

.auth-shell__eyebrow {
  display: inline-flex;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: rgba(37, 109, 255, 0.1);
  color: #2859c5;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.auth-shell__title {
  margin: 1rem 0 0;
  color: #1d3250;
  font-size: clamp(2rem, 4vw, 2.4rem);
}

.auth-shell__description {
  margin: 0.75rem 0 0;
  color: #5f7089;
  line-height: 1.6;
}

.auth-shell__switch {
  margin: 1.2rem 0 0;
  color: #5f7089;
}

.auth-shell__switch a {
  color: #245bdb;
  font-weight: 800;
  text-decoration: none;
}
</style>
