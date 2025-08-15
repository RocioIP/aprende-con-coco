<template>
  <div class="container py-5 text-center position-relative">
    <!-- Pantalla de juego -->
    <div v-if="!hasWon">
      <h2 class="mb-4 display-5 fw-bold">Com qual é que se assemelha?</h2>

      <!-- Letra objetivo -->
      <div class="target-letter mb-5 mx-auto">
        {{ currentLetter.letter }}
      </div>

      <!-- Opciones: campanas -->
      <div class="row justify-content-center g-4">
        <div
          class="col-6 col-md-3"
          v-for="(option, idx) in currentLetter.options"
          :key="idx"
        >
          <Bell
            :letter="option"
            :state="optionState(option)"
            :disabled="isLocked"
            @choose="onChoose"
          />
        </div>
      </div>
    </div>

    <!-- Pantalla de victoria -->
    <div v-else class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">🎉 Parabéns!</h1>
        <img
          src="/images/global/coco-aplaudiendo.webp"
          alt="Coco aplaudindo"
          class="img-coco-aplaudiendo"
        />
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">🎈 Mais uma!</button>
          <button class="btn-salir" @click="goToGames">✖ Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import Bell from '@/components/Bell.vue'

const router = useRouter()

const QUESTIONS_PER_ROUND = 5
const OPTIONS_PER_QUESTION = 2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
  audioCorrect = new Audio('/sounds/dingdong.mp3')
  audioWrong   = new Audio('/sounds/error.mp3')
  audioCorrect.load()
  audioWrong.load()

  // Hablar al inicio
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

function onChoose({ letter, center }) {
  checkAnswer(letter, center)
}

async function checkAnswer(option, center) {
  if (isLocked.value) return
  selectedOption.value = option
  const last = index.value === questions.value.length - 1

  if (option === currentLetter.value.answer) {
    result.value = 'correct'
    isLocked.value = true

    // Confeti en la campana acertada
    burstConfettiAt(center)
    await playSound('correct')

    if (last) {
      await nextTick()
      showWinScreen()
    } else {
      index.value++
      // Repite la pregunta en la siguiente ronda
      speak('Com qual é que se assemelha?')
    }
  } else {
    result.value = 'wrong'
    isLocked.value = true
    await playSound('wrong')
    result.value = null
    isLocked.value = false
  }
}

function optionState(option) {
  if (!result.value) return null
  if (result.value === 'correct' && option === currentLetter.value.answer) return 'correct'
  return null
}

function burstConfettiAt(center) {
  const nx = center ? center.x / window.innerWidth  : 0.5
  const ny = center ? center.y / window.innerHeight : 0.5
  confetti({
    particleCount: 140,
    spread: 75,
    startVelocity: 40,
    gravity: 0.9,
    origin: { x: nx, y: ny }
  })
}

function showWinScreen() {
  hasWon.value = true
  confetti({
    particleCount: 200,
    spread: 100,
    startVelocity: 45,
    gravity: 0.9,
    origin: { x: 0.5, y: 0.5 }
  })
  playSound('correct')
}

function resetGame() {
  hasWon.value = false
  questions.value = generateRound()
  index.value = 0
  result.value = null
  selectedOption.value = null
  isLocked.value = false

  // Volver a decir la frase
  speak('Com qual é que se assemelha?')
}

function goToGames() {
  router.push('/games')
}

function playSound(type) {
  return new Promise(resolve => {
    const audioObj = type === 'correct' ? audioCorrect : audioWrong
    if (audioObj) {
      audioObj.currentTime = 0
      audioObj.onended = resolve
      audioObj.play().catch(resolve)
    } else {
      resolve()
    }
  })
}

function speak(text, cb) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  if (cb) utterance.onend = cb
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
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
