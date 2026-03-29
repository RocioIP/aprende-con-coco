<template>
  <article class="metric-card" :class="`metric-card--${tone}`">
    <span class="metric-card__label">{{ label }}</span>
    <strong class="metric-card__value">{{ value }}</strong>
    <p v-if="hint" class="metric-card__hint">{{ hint }}</p>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    hint?: string
    label: string
    tone?: 'sky' | 'mint' | 'sun' | 'rose'
    value: number | string
  }>(),
  {
    hint: '',
    tone: 'sky',
  }
)
</script>

<style scoped>
.metric-card {
  padding: 1rem 1.1rem;
  border-radius: 1.35rem;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(28, 50, 80, 0.1);
}

.metric-card--sky {
  background: linear-gradient(180deg, rgba(237, 246, 255, 0.98), rgba(255, 255, 255, 0.98));
}

.metric-card--mint {
  background: linear-gradient(180deg, rgba(233, 252, 243, 0.98), rgba(255, 255, 255, 0.98));
}

.metric-card--sun {
  background: linear-gradient(180deg, rgba(255, 247, 223, 0.98), rgba(255, 255, 255, 0.98));
}

.metric-card--rose {
  background: linear-gradient(180deg, rgba(255, 238, 241, 0.98), rgba(255, 255, 255, 0.98));
}

.metric-card__label {
  display: block;
  color: #607089;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.metric-card__value {
  display: block;
  margin-top: 0.45rem;
  color: #1d3250;
  font-size: clamp(1.4rem, 1.8vw, 1.85rem);
  line-height: 1.05;
}

.metric-card__hint {
  margin: 0.5rem 0 0;
  color: #6f7f96;
  font-size: 0.9rem;
  line-height: 1.35;
}
</style>
