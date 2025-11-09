<template>
  <div
    ref="rootEl"
    class="bell-option"
    :class="{
      'is-locked': disabled,
      ring: state === 'correct' && animate
    }"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @touchstart.stop.prevent="handleClick"
    :aria-label="`Opción ${letter}`"
  >
    <!-- Campana en SVG con degradado dorado -->
    <svg class="bell-svg" viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <!-- Degradado dorado -->
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="#FFF6B7"/>
          <stop offset="30%" stop-color="#F4D03F"/>
          <stop offset="60%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#B5872F"/>
        </linearGradient>
        <!-- Sombra sutil -->
        <filter id="bell-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>

      <!-- Cuerpo -->
      <path
        class="bell-body"
        fill="url(#gold-grad)"
        d="M50 10 C30 10, 20 28, 20 46 V70
           C12 76, 8 84, 8 92 H92
           C92 84, 88 76, 80 70 V46
           C80 28, 70 10, 50 10 Z"
        filter="url(#bell-shadow)"
      />
      <!-- Aro superior y badajo (más oscuro) -->
      <rect x="32" y="18" width="36" height="6" rx="3" fill="#8F6A20" />
      <circle cx="50" cy="95" r="7" fill="#8F6A20" />
    </svg>

    <!-- Letra centrada -->
    <span class="bell-letter">{{ letter }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  letter: { type: String, required: true },
  state:  { type: String, default: null }, // 'correct' | null (no usamos 'wrong' visualmente)
  disabled: { type: Boolean, default: false },
  color: { type: String, default: '#D4AF37' }, // compat; no se usa
  animate: { type: Boolean, default: true },
})

const emit = defineEmits(['choose'])
const rootEl = ref(null)

function handleClick () {
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
  cursor: pointer;
  user-select: none;
  transition: transform .15s ease, filter .2s ease;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.18));
}
.bell-option:is(:hover, :focus-visible):not(.is-locked) {
  transform: translateY(-2px);
}

/* SVG ocupa todo el contenedor */
.bell-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Letra por encima de la campana */
.bell-letter {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 4rem;
  font-weight: 800;
  color: #3b2d06; /* contraste sobre dorado */
  text-shadow: 0 2px 6px rgba(255, 255, 255, .35);
  pointer-events: none;
}

.is-locked { cursor: default; opacity: .98; }

/* ÚNICA animación: “ding-dong” al acertar */
@keyframes ring {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-12deg); }
  40%  { transform: rotate(9deg); }
  60%  { transform: rotate(-6deg); }
  80%  { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
}
.ring { animation: ring .7s ease-in-out; transform-origin: 50% 18%; }
</style>
