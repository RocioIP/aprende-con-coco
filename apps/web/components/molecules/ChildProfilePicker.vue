<template>
  <section class="child-picker" :aria-label="label">
    <span class="child-picker__label">{{ label }}</span>

    <div class="child-picker__list">
      <button
        v-for="child in children"
        :key="child.id"
        type="button"
        class="child-picker__option"
        :class="{ 'is-active': child.id === selectedId }"
        @click="emit('select', child.id)"
      >
        <strong class="child-picker__name">{{ child.name }}</strong>
        <span class="child-picker__meta">
          {{ t('progress.child.sessionCount', { count: child._count.sessions }) }}
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChildSummary } from '@/types/progress'

defineProps<{
  children: ChildSummary[]
  label: string
  selectedId: number
}>()

const emit = defineEmits<{
  select: [childId: number]
}>()

const { t } = useI18n()
</script>

<style scoped>
.child-picker {
  display: grid;
  gap: 0.85rem;
}

.child-picker__label {
  color: #546885;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.child-picker__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.child-picker__option {
  min-width: min(100%, 13rem);
  padding: 0.95rem 1.1rem;
  border: 0;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 30px rgba(28, 50, 80, 0.1);
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    outline-color 0.2s ease;
}

.child-picker__option:is(:hover, :focus-visible) {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(28, 50, 80, 0.14);
}

.child-picker__option:focus-visible {
  outline: 3px solid rgba(60, 126, 244, 0.3);
  outline-offset: 3px;
}

.child-picker__option.is-active {
  background: linear-gradient(135deg, #1a8cff 0%, #3d68ff 100%);
  color: #ffffff;
}

.child-picker__name {
  display: block;
  font-size: 1.15rem;
}

.child-picker__meta {
  display: block;
  margin-top: 0.35rem;
  color: #697b95;
  font-size: 0.9rem;
}

.child-picker__option.is-active .child-picker__meta {
  color: rgba(255, 255, 255, 0.82);
}

@media (prefers-reduced-motion: reduce) {
  .child-picker__option {
    transition: none;
  }

  .child-picker__option:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
