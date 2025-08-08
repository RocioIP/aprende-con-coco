<template>
  <div class="container py-5 text-center position-relative">
    <!-- Pantalla de juego -->
    <div v-if="!hasWon">
      <h2 class="mb-4 display-5 fw-bold">
        Com qual é que se assemelha?
      </h2>

      <!-- Letra objetivo -->
      <div class="target-letter mb-5 mx-auto">
        {{ currentLetter.letter }}
      </div>

      <!-- Opciones (2) -->
      <div class="row justify-content-center g-4">
        <div
          class="col-6 col-md-3"
          v-for="(option, index) in currentLetter.options"
          :key="index"
        >
          <button
            class="option-button fs-1 w-100 py-4"
            :class="{
              'bg-success text-white': result === 'correct' && option === currentLetter.answer,
              'bg-danger text-white': result === 'wrong' && option === selectedOption
            }"
            @click="checkAnswer(option)"
            :disabled="isLocked"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="result" class="mt-4 fs-3 fw-bold" :class="{
        'text-success': result === 'correct',
        'text-danger': result === 'wrong'
      }">
        {{ result === 'correct' ? `🎉 Boa ${childName}!` : '😬 Não, tenta de novo' }}
      </div>
    </div>

    <!-- Pantalla de victoria con tarjeta Coco -->
    <div v-else class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">¡Boa {{ childName }}! 🎉</h1>
        <img
          src="/images/global/coco-aplaudiendo.png"
          alt="Coco aplaudiendo"
          class="img-coco-aplaudiendo"
        />
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">🎈 Mais uma!</button>
          <button class="btn-salir" @click="goToGames">✖ Fechar</button>
        </div>
      </div>
      <canvas id="confetti-canvas" class="confetti-canvas" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'

const router = useRouter()

const QUESTIONS_PER_ROUND = 5
const OPTIONS_PER_QUESTION = 2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const props = defineProps({
  childName: { type: String, default: 'Eduardo' }
})
const childName = ref(props.childName)

const questions = ref(generateRound())
const index = ref(0)
const selectedOption = ref(null)
const result = ref(null)
const isLocked = ref(false)
const hasWon = ref(false)

const currentLetter = computed(() => questions.value[index.value])

let audioCorrect = null
let audioWrong = null

onMounted(() => {
  audioCorrect = new Audio('/audio/boa.mp3')
  audioWrong = new Audio('/audio/ups.mp3')
  speak('Com qual é que se assemelha?')
})

watch(index, () => {
  selectedOption.value = null
  result.value = null
  isLocked.value = false
})

function generateRound () {
  const letters = sampleUnique(ALPHABET, QUESTIONS_PER_ROUND)
  return shuffle(
    letters.map(letter => {
      const distractor = sampleUnique(ALPHABET.filter(l => l !== letter), OPTIONS_PER_QUESTION - 1)
      return { letter, answer: letter, options: shuffle([letter, ...distractor]) }
    })
  )
}

async function checkAnswer(option) {
  if (isLocked.value) return
  selectedOption.value = option
  const last = index.value === questions.value.length - 1

  if (option === currentLetter.value.answer) {
    result.value = 'correct'
    isLocked.value = true

    if (last) {
      await nextTick()
      showWinScreen()
    } else {
      await playFeedback({ type: 'correct', text: `Boa ${childName.value}!` })
      index.value++
    }
  } else {
    result.value = 'wrong'
    isLocked.value = true
    await playFeedback({ type: 'wrong', text: 'Não, tenta de novo' })
    result.value = null
    isLocked.value = false
  }
}

function showWinScreen() {
  hasWon.value = true
  nextTick(() => {
    launchConfetti()
    playFeedback({ type: 'correct', text: `Boa ${childName.value}!` })
  })
}

function resetGame() {
  hasWon.value = false
  questions.value = generateRound()
  index.value = 0
  result.value = null
  selectedOption.value = null
  isLocked.value = false
  speak('Com qual é que se assemelha?')
}

function goToGames() {
  router.push('/games')
}

function playFeedback({ type, text }) {
  return new Promise(resolve => {
    const audioObj = type === 'correct' ? audioCorrect : audioWrong
    if (audioObj) {
      audioObj.currentTime = 0
      audioObj.onended = resolve
      audioObj.play().catch(() => {
        speak(text, resolve)
      })
    } else {
      speak(text, resolve)
    }
  })
}

function speak(text, cb) {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-PT'
  if (cb) u.onend = cb
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas')
  if (canvas) {
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
    myConfetti({
      particleCount: 180,
      spread: 90,
      startVelocity: 45,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 }
    })
  }
}

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
.target-letter {
  font-size: 6rem;
  font-weight: bold;
  color: #0dcaf0;
  background: #e7f9ff;
  width: 140px;
  height: 140px;
  line-height: 140px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  user-select: none;
}

.option-button {
  font-size: 3rem;
  border: 4px solid #ccc;
  border-radius: 20px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}
.option-button:hover:not(:disabled) {
  background: #eef5ff;
  border-color: #0d6efd;
}

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
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
}

.img-coco-aplaudiendo {
  width: min(40vw, 220px);
  max-width: 220px;
}

.btn-mais-uma,
.btn-salir {
  border: none;
  border-radius: 30px;
  padding: 0.65rem 1.4rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,.15);
  transition: transform .15s ease, background-color .15s ease;
  cursor: pointer;
}

.btn-mais-uma {
  background-color: #108818;
  color: #fff;
}
.btn-mais-uma:hover { background-color: #198e09; transform: translateY(-1px); }

.btn-salir {
  background: #e9ecef;
  color: #333;
}
.btn-salir:hover { background: #dee2e6; transform: translateY(-1px); }
</style>
