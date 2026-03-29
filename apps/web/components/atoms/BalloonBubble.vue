<template>
  <button
    ref="rootEl"
    class="balloon"
    :class="[sizeClass, { shake: isShaking }]"
    :disabled="disabled"
    type="button"
    :style="balloonStyle"
    @click="handleClick"
  >
    <span class="balloon-text">{{ letter }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BalloonSize } from '@/stores/games/balloons'

const props = withDefaults(
  defineProps<{
    color: string
    disabled?: boolean
    id: string
    isShaking?: boolean
    letter: string
    size: BalloonSize
    x: number
    y: number
  }>(),
  {
    disabled: false,
    isShaking: false,
  }
)

const emit = defineEmits<{
  select: [payload: { center: { x: number; y: number } | null; id: string }]
}>()

const rootEl = ref<HTMLElement | null>(null)

const sizeClass = computed(() => (props.size === 'pequeno' ? 'small' : 'big'))

const balloonStyle = computed(() => {
  const dimensions = props.size === 'pequeno'
    ? { h: 90, w: 75 }
    : { h: 120, w: 100 }

  return {
    backgroundColor: props.color,
    height: `${dimensions.h}px`,
    left: `${props.x}px`,
    top: `${props.y}px`,
    width: `${dimensions.w}px`,
  }
})

function handleClick() {
  if (props.disabled) return

  const rect = rootEl.value?.getBoundingClientRect()
  const center = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : null

  emit('select', { center, id: props.id })
}
</script>

<style scoped>
.balloon {
  position: absolute;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  font-size: 2rem;
  color: #fff;
  text-align: center;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 1;
  animation: float 4s ease-in-out infinite;
}

.balloon:disabled {
  cursor: default;
}

.balloon-text {
  pointer-events: none;
}

.balloon::after {
  content: '';
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 30px;
  background-color: #444;
  z-index: 0;
}

.balloon::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 6px;
  background-color: inherit;
  border-radius: 2px;
  z-index: 2;
}

.big,
.small {
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
}

.shake {
  animation: shake 0.3s;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (prefers-reduced-motion: reduce) {
  .balloon {
    animation: none;
    transition: none;
  }

  .shake {
    animation: none;
    outline: 4px solid rgba(220, 53, 69, 0.28);
    outline-offset: 2px;
  }
}
</style>
