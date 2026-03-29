<template>
  <aside class="selector">
    <img
      src="/images/blackboard/painter.webp"
      :alt="mascotAlt"
      class="selector-mascot"
    />

    <div class="selector-buttons">
      <BlackboardToolButton
        v-for="activity in activities"
        :key="activity.id"
        :active="activity.id === activeActivity"
        :icon="activity.icon"
        :label="activity.label"
        @select="emit('select', activity.id)"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import BlackboardToolButton from '@/components/atoms/BlackboardToolButton.vue'
import type { BlackboardActivity } from '@/types/blackboard'

interface ActivityViewModel {
  icon: string
  id: BlackboardActivity
  label: string
}

defineProps<{
  activeActivity: BlackboardActivity
  activities: ActivityViewModel[]
  mascotAlt: string
}>()

const emit = defineEmits<{
  select: [activity: BlackboardActivity]
}>()
</script>

<style scoped>
.selector {
  display: grid;
  gap: 1rem;
  align-items: start;
}

.selector-mascot {
  width: min(100%, 160px);
  justify-self: center;
}

.selector-buttons {
  display: grid;
  gap: 0.75rem;
}

@media (max-width: 820px) {
  .selector {
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  .selector-buttons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .selector {
    grid-template-columns: 1fr;
  }

  .selector-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
