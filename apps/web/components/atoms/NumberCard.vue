<template>
  <button
    class="card-wrapper"
    :class="{ shake }"
    :disabled="disabled || flipped"
    type="button"
    @click="handleClick"
  >
    <div class="num-card" :class="{ flipped }">
      <div class="num-card-face num-card-front" :style="frontStyle">
        <div class="num">
          <span class="num-base" :style="{ color: solidColor }">{{ value }}</span>
          <span class="num-pattern" :style="patternStyle">{{ value }}</span>
        </div>
      </div>

      <div class="num-card-face num-card-back">
        <img
          src="/images/global/coco-aplaudiendo.webp"
          :alt="t('home.mascotAlt')"
          class="coco-img"
        />
        <div class="good-label">{{ t('common.messages.good') }}</div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    flipped?: boolean
    shake?: boolean
    value: number
  }>(),
  {
    disabled: false,
    flipped: false,
    shake: false,
  }
)

const emit = defineEmits<{
  choose: [value: number]
}>()

const { t } = useI18n()

const palette = [
  '#F3C132',
  '#8E59CF',
  '#49A9F8',
  '#5CBF6A',
  '#F3A542',
  '#EB5A6E',
  '#13B0A5',
  '#FF7AC3',
  '#5673E0',
  '#9ED356',
]

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized
  const value = Number.parseInt(full, 16)

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value))
}

function lighten(hex: string, amount = 0.2) {
  const { r, g, b } = hexToRgb(hex)
  const nextRed = clamp(Math.round(r + (255 - r) * amount))
  const nextGreen = clamp(Math.round(g + (255 - g) * amount))
  const nextBlue = clamp(Math.round(b + (255 - b) * amount))

  return `rgb(${nextRed}, ${nextGreen}, ${nextBlue})`
}

function darken(hex: string, amount = 0.15) {
  const { r, g, b } = hexToRgb(hex)
  const nextRed = clamp(Math.round(r * (1 - amount)))
  const nextGreen = clamp(Math.round(g * (1 - amount)))
  const nextBlue = clamp(Math.round(b * (1 - amount)))

  return `rgb(${nextRed}, ${nextGreen}, ${nextBlue})`
}

const baseColor = computed(() => palette[(props.value - 1) % palette.length] ?? palette[0])
const solidColor = computed(() => darken(baseColor.value, 0.1))

const frontStyle = computed(() => ({
  background: '#fff',
  border: `6px solid ${baseColor.value}`,
}))

const patternStyle = computed(() => {
  const light = lighten(baseColor.value, 0.35)
  const dark = darken(baseColor.value, 0.05)
  const variant = props.value % 3
  let backgroundImage = ''

  if (variant === 1) {
    backgroundImage = `radial-gradient(${light} 22%, transparent 24%) 0 0/22px 22px, radial-gradient(${light} 22%, transparent 24%) 11px 11px/22px 22px, ${dark}`
  } else if (variant === 2) {
    backgroundImage = `repeating-linear-gradient(45deg, ${light}, ${light} 10px, ${dark} 10px, ${dark} 20px)`
  } else {
    backgroundImage = `repeating-linear-gradient(0deg, ${light} 0 14px, transparent 14px 28px), repeating-linear-gradient(90deg, ${light} 0 14px, ${dark} 14px 28px), ${light}`
  }

  return {
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    backgroundImage,
    color: 'transparent',
    inset: '0',
    position: 'absolute',
  }
})

function handleClick() {
  if (props.disabled || props.flipped) return
  emit('choose', props.value)
}
</script>

<style scoped>
.card-wrapper {
  width: clamp(190px, 18vw, 230px);
  aspect-ratio: 10 / 13;
  perspective: 1000px;
  cursor: pointer;
  user-select: none;
  border: none;
  background: transparent;
  padding: 0;
}

.card-wrapper:disabled {
  cursor: default;
}

.num-card {
  position: relative;
  max-width: 420px;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.num-card.flipped {
  transform: rotateY(180deg);
}

.num-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
  height: stretch;
}

.num-card-front {
  position: relative;
}

.num-card-front::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  box-shadow: inset 0 0 0 6px rgba(255, 255, 255, 0.85);
  pointer-events: none;
}

.num {
  position: relative;
  display: inline-block;
  font-size: clamp(6rem, 16vw, 10rem);
  font-weight: 900;
  line-height: 0.9;
}

.num-base {
  position: relative;
  z-index: 1;
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.85);
  -webkit-text-stroke: 3px rgba(0, 0, 0, 0.03);
}

.num-pattern {
  z-index: 2;
}

.num-card-back {
  background: #e8fff0;
  transform: rotateY(180deg);
  flex-direction: column;
  padding: 10px;
}

.coco-img {
  width: 65%;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
}

.good-label {
  margin-top: 6px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #108818;
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}

.shake .num-card {
  animation: shake 0.5s ease both;
}

.card-wrapper:hover .num-card,
.card-wrapper:focus-visible .num-card {
  transform: translateY(-2px) scale(1.01);
}

.card-wrapper:hover .num-card.flipped,
.card-wrapper:focus-visible .num-card.flipped {
  transform: rotateY(180deg) translateY(-2px) scale(1.01);
}

@media (prefers-reduced-motion: reduce) {
  .num-card {
    transition: none;
  }

  .shake .num-card {
    animation: none;
    box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.18);
  }

  .card-wrapper:hover .num-card,
  .card-wrapper:focus-visible .num-card {
    transform: none;
  }

  .card-wrapper:hover .num-card.flipped,
  .card-wrapper:focus-visible .num-card.flipped {
    transform: rotateY(180deg);
  }
}
</style>
