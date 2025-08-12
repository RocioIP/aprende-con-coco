<template>
  <div class="container py-5 text-center position-relative overflow-hidden" style="min-height: 100vh;">
    <h2 class="mb-4 display-5 fw-bold" v-if="!hasWon">Que animal faz este som?</h2>

    <!-- Botón para repetir el sonido -->
    <button v-if="!hasWon" class="btn btn-info mb-4" @click="playSound" :disabled="isLocked">
      🔊 Escuchar sonido
    </button>

    <!-- Opciones de animales -->
    <div v-if="!hasWon" class="row justify-content-center g-4">
      <div
        class="col-6 col-md-3"
        v-for="(animal, index) in currentQuestion.options"
        :key="index"
      >
        <div
          class="animal-card p-3 border rounded shadow-sm h-100"
          :class="{
            'bg-success text-white': result === 'correct' && animal.name === currentQuestion.answer,
            'bg-danger text-white': result === 'wrong' && animal.name === selectedOption
          }"
          @click="checkAnswer(animal.name)"
        >
          <img :src="animal.image" :alt="animal.name" class="img-fluid rounded mb-2" />
          <div class="fs-4">{{ animal.name }}</div>
        </div>
      </div>
    </div>

    <!-- Feedback visual (solo mientras no hay overlay) -->
    <div v-if="result && !hasWon" class="mt-4 fs-3 fw-bold"
         :class="{ 'text-success': result === 'correct', 'text-danger': result === 'wrong' }">
      {{ result === 'correct' ? '🎉 Boa, Eduardo!' : '😬 Não, tenta de novo' }}
    </div>

    <!-- Pantalla de victoria (tarjeta Coco + confeti + botones) -->
    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">¡Boa Eduardo! 🎉</h1>
        <img src="/images/global/coco-aplaudiendo.webp" alt="Coco aplaudiendo" class="img-coco-aplaudiendo">
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">🎈 Mais uma!</button>
          <button class="btn-salir" @click="goToGames">✖ Fechar</button>
        </div>
      </div>
      <canvas id="confetti-canvas" class="confetti-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'

/* --------- Config --------- */
const QUESTIONS_PER_ROUND = 5

const ANIMALS = [
  { name: 'León',   sound: '/sounds/animals/lion.mp3',    image: '/images/games/animals/lion.webp' },
  { name: 'Perro',  sound: '/sounds/animals/dog.mp3',     image: '/images/games/animals/dog.webp' },
  { name: 'Gato',   sound: '/sounds/animals/cat.mp3',     image: '/images/games/animals/cat.webp' },
  { name: 'Pato',   sound: '/sounds/animals/duck.mp3',    image: '/images/games/animals/duck.webp' },
  { name: 'Gallo',  sound: '/sounds/animals/rooster.mp3', image: '/images/games/animals/rooster.webp' },
]

/* --------- Estado --------- */
const router = useRouter()

const questions = ref(generateRound())
const index = ref(0)
const selectedOption = ref(null)
const result = ref(null)
const isLocked = ref(false)
const hasWon = ref(false)

const currentQuestion = computed(() => questions.value[index.value])

let audio = null       // sonido del animal
let audioCorrect = null // /audio/boa.mp3
let audioWrong = null   // /audio/ups.mp3

onMounted(() => {
  // prepara audios de feedback (si no existen, usaremos TTS)
  audioCorrect = new Audio('/audio/boa.mp3')
  audioWrong   = new Audio('/audio/ups.mp3')
  playSound()
})

/* Reproduce automáticamente el sonido del animal al cambiar de pregunta */
watch(index, () => {
  selectedOption.value = null
  result.value = null
  isLocked.value = false
  playSound()
})

/* --------- Lógica --------- */
function generateRound() {
  const targets = sampleUnique(ANIMALS, QUESTIONS_PER_ROUND)
  const qs = targets.map(target => {
    const distractor = sampleUnique(ANIMALS.filter(a => a.name !== target.name), 1)[0]
    const options = shuffle([
      { name: target.name, image: target.image },
      { name: distractor.name, image: distractor.image },
    ])
    return { sound: target.sound, answer: target.name, options }
  })
  return shuffle(qs)
}

function playSound() {
  if (typeof window === 'undefined') return
  try {
    if (audio) { audio.pause(); audio.currentTime = 0 }
    audio = new Audio(currentQuestion.value.sound)
    audio.play()
  } catch {}
}

async function checkAnswer(selected) {
  if (isLocked.value) return
  selectedOption.value = selected
  isLocked.value = true

  if (selected === currentQuestion.value.answer) {
    result.value = 'correct'
    // feedback de acierto y avance automático
    await playFeedback({ type: 'correct', text: 'Boa Eduardo!' })
    await goNextOrWin()
  } else {
    result.value = 'wrong'
    // feedback de error y permitir reintento
    await playFeedback({ type: 'wrong', text: 'Não, tenta de novo' })
    result.value = null
    isLocked.value = false
  }
}

async function goNextOrWin() {
  if (index.value < questions.value.length - 1) {
    index.value++
  } else {
    hasWon.value = true
    await nextTick()
    // al mostrar tarjeta, no duplicamos audio (ya lo oyeron al acertar)
    launchConfetti()
  }
}

function resetGame() {
  stopSound()
  hasWon.value = false
  questions.value = generateRound()
  index.value = 0
  selectedOption.value = null
  result.value = null
  isLocked.value = false
  playSound()
}

function goToGames() {
  stopSound()
  router.push('/games')
}

function stopSound() {
  try { if (audio) { audio.pause(); audio.currentTime = 0 } } catch {}
}

/* --------- Feedback (audio o TTS) --------- */
function playFeedback({ type, text }) {
  return new Promise(resolve => {
    const audioObj = type === 'correct' ? audioCorrect : audioWrong
    if (audioObj && audioObj.play) {
      try { audioObj.currentTime = 0 } catch {}
      audioObj.onended = () => resolve()
      audioObj.play().catch(() => {
        // fallback TTS
        speakText(text, resolve)
      })
    } else {
      speakText(text, resolve)
    }
  })
}

function speakText(text, onend) {
  try {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'pt-PT'
    if (onend) utter.onend = onend
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  } catch {
    if (onend) onend()
  }
}

/* --------- Confeti final --------- */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas')
  if (!canvas) return
  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
  myConfetti({
    particleCount: 180,
    spread: 90,
    startVelocity: 45,
    gravity: 0.9,
    origin: { x: 0.5, y: 0.5 }
  })
}

/* --------- Utils --------- */
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sampleUnique(pool, n) {
  const copy = pool.slice()
  const out = []
  n = Math.min(n, copy.length)
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}
</script>

<style scoped>
.animal-card {
  transition: transform 0.2s ease;
  cursor: pointer;
}
.animal-card:hover { transform: scale(1.05); }

button:disabled { opacity: 0.6; cursor: not-allowed; }

/* Overlay tipo tarjeta Coco (no bloqueante global, solo la tarjeta) */
.win-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.35);
  z-index: 1040;
  pointer-events: none;
}
.win-card {
  pointer-events: auto;
  background: #fff;
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  text-align: center;
  max-width: 420px;
  width: calc(100% - 2rem);
}
.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: -1;
}

.img-coco-aplaudiendo {
  width: min(40vw, 220px);
  max-width: 220px;
}

.btn-mais-uma, .btn-salir {
  border: none; border-radius: 30px;
  padding: 0.65rem 1.4rem; font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,.15);
  transition: transform .15s ease, background-color .15s ease;
  cursor: pointer;
}
.btn-mais-uma { background-color: #108818; color: #fff; }
.btn-mais-uma:hover { background-color: #198e09; transform: translateY(-1px); }
.btn-salir { background: #e9ecef; color: #333; }
.btn-salir:hover { background: #dee2e6; transform: translateY(-1px); }
</style>
