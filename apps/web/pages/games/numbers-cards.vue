<template>
  <div class="container pt-2 pb-3 text-center">
    <h2 class="display-6 fw-bold mb-1">
      {{ t('games.numbersCards.titleBeforeNumber') }}
      <span class="target-number">{{ targetNumber }}</span>{{ t('games.numbersCards.titleAfterNumber') }}
    </h2>

    <div class="cards-grid" @click.once="unlockAudioOnce">
      <div
        v-for="card in cards"
        :key="card.value"
        class="card-wrapper"
        :class="{ shake: card.shake }"
        @click="onCardClick(card)"
      >
        <div class="num-card" :class="{ flipped: card.flipped }">
          <div class="num-card-face num-card-front" :style="frontStyle(card)">
            <div class="num" :style="numContainerStyle">
              <span class="num-base" :style="{ color: solidColor(card) }">{{ card.value }}</span>
              <span class="num-pattern" :style="patternStyle(card)">{{ card.value }}</span>
            </div>
          </div>
          <div class="num-card-face num-card-back">
            <img
              src="/images/global/coco-aplaudiendo.webp"
              alt="Coco aplaudindo"
              class="coco-img"
            />
            <div class="boa">{{ t('common.messages.good') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="controls mt-3">
      <button class="btn btn-outline-primary btn-lg rounded-pill" @click="repeatQuestion">
        🔊 {{ t('common.buttons.repeat') }}
      </button>
      <button class="btn btn-light btn-lg rounded-pill ms-2" @click="goToGames">✖ {{ t('common.buttons.close') }}</button>
    </div>

    <div v-if="finished" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">🎉 {{ t('common.messages.congrats') }}</h1>
        <img src="/images/global/coco-aplaudiendo.webp" alt="Coco aplaudindo" class="img-coco-aplaudiendo" />
        <p class="mb-3">{{ t('common.messages.roundsComplete') }}</p>
        <div class="d-flex gap-2 justify-content-center mt-2">
          <button class="btn-mais-uma" @click="resetGame">🎈 {{ t('common.buttons.playAgain') }}</button>
          <button class="btn-salir" @click="goToGames">✖ {{ t('common.buttons.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { speechVoices } from '@/lang'

const ROUND_SIZE = 3 // 3 cartas por ronda
const MAX_ROUNDS = 3 // 3 rondas
const roundIndex = ref(1)
const finished = ref(false)
const cards = ref([])

const targetNumber = ref(1)
let errorSound
let successSound
const audioUnlocked = ref(false)
const router = useRouter()
const { t, locale } = useI18n()
const voice = computed(() => speechVoices[locale.value] ?? speechVoices.es)

// Paleta fuerte-suave para borde y número (tipo material escolar)
const palette = [
  '#F3C132', // amarillo
  '#8E59CF', // morado
  '#49A9F8', // azul
  '#5CBF6A', // verde
  '#F3A542', // naranja
  '#EB5A6E', // rojo/rosa
  '#13B0A5', // turquesa
  '#FF7AC3', // rosa
  '#5673E0', // índigo
  '#9ED356', // lima
]

function hexToRgb(h) {
  const s = h.replace('#','')
  const b = s.length === 3 ? s.split('').map(c=>c+c).join('') : s
  const n = parseInt(b, 16)
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 }
}
function clamp(v){ return Math.max(0, Math.min(255, v)) }
function lighten(hex, amount=0.2) {
  const {r,g,b} = hexToRgb(hex)
  const nr = clamp(Math.round(r + (255 - r) * amount))
  const ng = clamp(Math.round(g + (255 - g) * amount))
  const nb = clamp(Math.round(b + (255 - b) * amount))
  return `rgb(${nr}, ${ng}, ${nb})`
}
function darken(hex, amount=0.15) {
  const {r,g,b} = hexToRgb(hex)
  const nr = clamp(Math.round(r * (1-amount)))
  const ng = clamp(Math.round(g * (1-amount)))
  const nb = clamp(Math.round(b * (1-amount)))
  return `rgb(${nr}, ${ng}, ${nb})`
}

function frontStyle(card){
  const base = palette[(card.value - 1) % palette.length]
  const border = base
  return {
    background: '#fff',
    border: `6px solid ${border}`,
  }
}
const numContainerStyle = {
  position: 'relative',
  lineHeight: 1,
}

function solidColor(card){
  const base = palette[(card.value - 1) % palette.length]
  return darken(base, 0.1)
}

function patternStyle(card){
  const base = palette[(card.value - 1) % palette.length]
  const light = lighten(base, 0.35)
  const dark = darken(base, 0.05)
  const variant = card.value % 3
  let bg
  if (variant === 1) {
    // lunares
    bg = `radial-gradient(${light} 22%, transparent 24%) 0 0/22px 22px, radial-gradient(${light} 22%, transparent 24%) 11px 11px/22px 22px, ${dark}`
  } else if (variant === 2) {
    // rayas diagonales
    bg = `repeating-linear-gradient(45deg, ${light}, ${light} 10px, ${dark} 10px, ${dark} 20px)`
  } else {
    // vichy/gingham
    bg = `
      repeating-linear-gradient(0deg, ${light} 0 14px, transparent 14px 28px),
      repeating-linear-gradient(90deg, ${light} 0 14px, ${dark} 14px 28px),
      ${light}
    `
  }
  return {
    backgroundImage: bg,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    position: 'absolute',
    inset: '0',
  }
}

onMounted(() => {
  if (import.meta.client) {
    errorSound = new Audio('/sounds/error.mp3')
    successSound = new Audio('/sounds/true.mp3')
  }
  startRound()
  // Intento inicial de hablar; si el navegador bloquea, se podrá con el primer toque
  setTimeout(() => askForTarget(), 200)
})

watch(
  () => cards.value.filter(c => !c.flipped).length,
  (remaining) => {
    if (remaining === 0 && !finished.value) {
      speakText(t('common.messages.good'))
      setTimeout(() => {
        if (roundIndex.value >= MAX_ROUNDS) {
          finished.value = true
          try { successSound && successSound.play() } catch {}
          speakText(t('common.messages.greatJob'))
        } else {
          roundIndex.value++
          startRound()
          askForTarget()
        }
      }, 2000)
    }
  }
)

function onCardClick(card) {
  if (card.flipped) return
  if (card.value === targetNumber.value) {
    card.flipped = true
    try { successSound && successSound.play() } catch {}
    const remaining = cards.value.filter(c => !c.flipped)
    if (remaining.length > 0) {
      setTimeout(() => {
        pickNextTarget()
        askForTarget()
      }, 3000)
    }
  } else {
    card.shake = true
    try { errorSound && errorSound.play() } catch {}
    setTimeout(() => (card.shake = false), 500)
  }
}

function pickNextTarget() {
  const remaining = cards.value.filter(c => !c.flipped)
  if (remaining.length === 0) return
  const idx = Math.floor(Math.random() * remaining.length)
  targetNumber.value = remaining[idx].value
}

function askForTarget() {
  if (finished.value) return
  const text = t('games.numbersCards.speakPrompt', { number: targetNumber.value })
  speakText(text)
}

function repeatQuestion() {
  audioUnlocked.value = true
  askForTarget()
}

function speakText(text) {
  try {
    if (!import.meta.client) return
    if (!audioUnlocked.value && speechSynthesis.speaking) speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice.value
    // Pequeño retraso mejora fiabilidad tras montado
    setTimeout(() => {
      try { speechSynthesis.cancel() } catch {}
      try { speechSynthesis.speak(u) } catch {}
    }, 10)
  } catch {}
}

function unlockAudioOnce() {
  audioUnlocked.value = true
}

function startRound() {
  if (finished.value) return
  // Siempre 3 números únicos entre 1 y 10
  const pool = Array.from({ length: 10 }, (_, i) => i + 1)
  const round = []
  while (round.length < ROUND_SIZE) {
    const i = Math.floor(Math.random() * pool.length)
    round.push(pool.splice(i, 1)[0])
  }
  cards.value = round.map(v => ({ value: v, flipped: false, shake: false }))
  pickNextTarget()
}

function resetGame() {
  finished.value = false
  roundIndex.value = 1
  startRound()
  askForTarget()
}

function goToGames() {
  try { speechSynthesis.cancel() } catch {}
  router.push('/games')
}
</script>

<style scoped>
.target-number {
  font-size: clamp(3rem, 8vw, 6rem);
  color: #0d6efd;
  background: #EAF3FF; /* azul clarito de fondo */
  padding: 0.1em 0.35em; /* proporcional al tamaño */
  border-radius: 0.25em;
  box-shadow: 0 1px 0 rgba(13,110,253,0.06) inset, 0 0 0 2px rgba(13,110,253,0.06);
  vertical-align: middle;
  line-height: 1;
  font-weight: 900;
  display: inline-block;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
  gap: 24px;
  max-width: 1280px;
  margin: 2rem;
}

@media (max-width: 1024px) {
  .cards-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 820px) {
  .cards-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 420px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}

.card-wrapper {
  perspective: 1000px;
  cursor: pointer;
  user-select: none;
  /* Tamaño "clásico" similar a la primera prueba */
  width: clamp(190px, 18vw, 230px);
  aspect-ratio: 10 / 13; /* ~1.3 alto, como padding-top:130% */
}

.num-card {
  position: relative;
  width: 100%;
  height: 100%; /* mismo alto que el wrapper */
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}
.num-card.flipped { transform: rotateY(180deg); }

.num-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(190px, 18vw, 230px);
  aspect-ratio: 10 / 13;
  box-shadow: 0 10px 25px rgba(0,0,0,0.18);
}

.num-card-front { background: #fff; border: 3px solid #f0f0f0; }
.num-card-front { position: relative; }
.num-card-front::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  /* marco interior suave */
  box-shadow: inset 0 0 0 6px rgba(255,255,255,0.85);
  pointer-events: none;
  opacity: 1;
}
.num-card-front .num { font-size: clamp(6rem, 16vw, 10rem); font-weight: 900; position: relative; display: inline-block; line-height: 0.9; }
.num-base { position: relative; z-index: 1; text-shadow: 0 3px 0 rgba(255,255,255,0.85); -webkit-text-stroke: 3px rgba(0,0,0,0.03); }
.num-pattern { z-index: 2; }

.num-card-back { background: #e8fff0; transform: rotateY(180deg); flex-direction: column; padding: 10px; }
.coco-img { width: 65%; height: auto; object-fit: contain; border-radius: 10px; }
.boa { margin-top: 6px; font-size: 1.5rem; font-weight: 800; color: #108818; }

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}
.shake .num-card { animation: shake 0.5s ease both; }

/* sutil feedback al tocar/hover */
.card-wrapper:active .num-card,
.card-wrapper:hover .num-card { transform: translateY(-2px) scale(1.01); }
.card-wrapper:active .num-card.flipped,
.card-wrapper:hover .num-card.flipped { transform: rotateY(180deg) translateY(-2px) scale(1.01); }

/* Overlay final */
.win-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.9); display: grid; place-items: center; z-index: 999; }
.win-card { background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.2); max-width: 420px; width: calc(100% - 2rem); }
.img-coco-aplaudiendo { width: min(40vw, 220px); max-width: 220px; margin: .5rem auto 1rem; display: block; }
.btn-mais-uma, .btn-salir { border: none; border-radius: 30px; padding: 0.65rem 1.4rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,.15); transition: transform .15s ease; cursor: pointer; }
.btn-mais-uma { background: #108818; color: #fff; }
.btn-mais-uma:hover { background: #198e09; transform: translateY(-1px); }
.btn-salir { background: #e9ecef; color: #333; }
.btn-salir:hover { background: #dee2e6; transform: translateY(-1px); }
</style>
