<template>
  <div class="level-switcher">
    <button
      v-for="option in options"
      :key="option.value"
      class="level-button"
      :class="{ active: selected === option.value }"
      :disabled="disabled"
      type="button"
      @click="emit('select', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface GameLevelOption {
  label: string
  value: number | string
}

withDefaults(
  defineProps<{
    disabled?: boolean
    options: GameLevelOption[]
    selected: number | string
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  select: [value: number | string]
}>()
</script>

<style scoped>
.level-switcher {
  display: flex;
  gap: 0.5rem;
}

.level-button {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-weight: 700;
  background: #e9ecef;
  cursor: pointer;
}

.level-button.active {
  background: #0d6efd;
  color: #fff;
}

.level-button:disabled {
  cursor: default;
  opacity: 0.7;
}
</style>
