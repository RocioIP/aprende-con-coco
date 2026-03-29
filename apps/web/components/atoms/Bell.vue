<template>
  <button
    ref="rootEl"
    class="bell-option"
    :class="{ ring: state === 'correct' && animate }"
    :aria-label="ariaLabel"
    :disabled="disabled"
    type="button"
    @click="handleClick"
  >
    <svg class="bell-svg" viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF6B7" />
          <stop offset="30%" stop-color="#F4D03F" />
          <stop offset="60%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#B5872F" />
        </linearGradient>
        <filter :id="shadowId" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25" />
        </filter>
      </defs>

      <path
        class="bell-body"
        :fill="`url(#${gradientId})`"
        d="M50 10 C30 10, 20 28, 20 46 V70
           C12 76, 8 84, 8 92 H92
           C92 84, 88 76, 80 70 V46
           C80 28, 70 10, 50 10 Z"
        :filter="`url(#${shadowId})`"
      />
      <rect x="32" y="18" width="36" height="6" rx="3" fill="#8F6A20" />
      <circle cx="50" cy="95" r="7" fill="#8F6A20" />
    </svg>

    <span class="bell-letter">{{ letter }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

interface BellChoosePayload {
  center: { x: number; y: number } | null
  letter: string
}

interface BellProps {
  animate?: boolean
  disabled?: boolean
  letter: string
  state?: 'correct' | 'wrong' | null
}

const props = withDefaults(defineProps<BellProps>(), {
  animate: true,
  disabled: false,
  state: null,
})

const emit = defineEmits<{
  choose: [payload: BellChoosePayload]
}>()

const { t } = useI18n()
const rootEl = ref<HTMLButtonElement | null>(null)
const uniqueId = useId().replace(/:/g, '')
const gradientId = `bell-gradient-${uniqueId}`
const shadowId = `bell-shadow-${uniqueId}`

const ariaLabel = computed(() =>
  t('common.accessibility.option', { value: props.letter })
)

function handleClick() {
  if (props.disabled) return

  const rect = rootEl.value?.getBoundingClientRect()
  const center = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : null

  emit('choose', { letter: props.letter, center })
}
</script>

<style scoped>
.bell-option {
  position: relative;
  width: 176px;
  height: 200px;
  margin-inline: auto;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, filter 0.2s ease, opacity 0.2s ease;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.18));
}

.bell-option:not(:disabled):is(:hover, :focus-visible) {
  transform: translateY(-2px);
}

.bell-option:focus-visible {
  outline: 4px solid rgba(13, 202, 240, 0.28);
  outline-offset: 6px;
}

.bell-option:disabled {
  cursor: default;
  opacity: 0.98;
}

.bell-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bell-letter {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 4rem;
  font-weight: 800;
  color: #3b2d06;
  text-shadow: 0 2px 6px rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

@keyframes ring {
  0% { transform: rotate(0deg); }
  20% { transform: rotate(-12deg); }
  40% { transform: rotate(9deg); }
  60% { transform: rotate(-6deg); }
  80% { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
}

.ring {
  animation: ring 0.7s ease-in-out;
  transform-origin: 50% 18%;
}

@media (prefers-reduced-motion: reduce) {
  .bell-option {
    transition: none;
  }

  .bell-option:not(:disabled):is(:hover, :focus-visible) {
    transform: none;
  }

  .ring {
    animation: none;
  }
}
</style>
