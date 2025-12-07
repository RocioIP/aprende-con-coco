<template>
  <div class="container py-5 text-center position-relative overflow-hidden" style="min-height: 100vh;">
    <h2 class="mb-4 display-5 fw-bold" v-if="!hasWon">{{ titleText }}</h2>

    <button v-if="!hasWon" class="btn btn-info mb-4" @click="playSound" :disabled="isLocked">
      🔊 {{ buttonText }}
    </button>

    <div v-if="!hasWon" class="row justify-content-center g-4">
      <div class="col-6 col-md-3" v-for="(animal, index) in currentQuestion.options" :key="index">
        <div
          class="animal-card p-3 border rounded shadow-sm h-100"
          :class="{
            'bg-success text-white': result === 'correct' && animal.key === currentQuestion.answer,
            'bg-danger text-white': result === 'wrong' && animal.key === selectedOption
          }"
          @click="checkAnswer(animal.key)"
        >
          <img :src="animal.image" :alt="animalLabel(animal.key)" class="img-fluid rounded mb-2" />
          <div class="fs-4">{{ animalLabel(animal.key) }}</div>
        </div>
      </div>
    </div>

    <div
      v-if="result && !hasWon"
      class="mt-4 fs-3 fw-bold"
      :class="{ 'text-success': result === 'correct', 'text-danger': result === 'wrong' }"
    >
      {{ result === 'correct' ? feedbackCorrect : feedbackWrong }}
    </div>

    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">{{ winTitle }}</h1>
        <img src="/images/global/coco-aplaudiendo.webp" alt="Coco aplaudiendo" class="img-coco-aplaudiendo" />
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">🎈 {{ t('common.buttons.playAgain') }}</button>
          <button class="btn-salir" @click="goToGames">✖ {{ t('common.buttons.close') }}</button>
        </div>
      </div>
      <canvas id="confetti-canvas" class="confetti-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'
import { speechVoices } from '@/lang'

const QUESTIONS_PER_ROUND = 5
const ANIMALS = [
  { key: 'lion', sound: '/sounds/animals/lion.mp3', image: '/images/games/animals/lion.webp' },
  { key: 'dog', sound: '/sounds/animals/dog.mp3', image: '/images/games/animals/dog.webp' },
  { key: 'cat', sound: '/sounds/animals/cat.mp3', image: '/images/games/animals/cat.webp' },
  { key: 'duck', sound: '/sounds/animals/duck.mp3', image: '/images/games/animals/duck.webp' },
  { key: 'rooster', sound: '/sounds/animals/rooster.mp3', image: '/images/games/animals/rooster.webp' },
] as const

type AnimalKey = (typeof ANIMALS)[number]['key']

const router = useRouter()
const { t, locale } = useI18n()
const voice = computed(() => speechVoices[locale.value] ?? speechVoices.es)
const titleText = ref('')
const buttonText = ref('')
const feedbackCorrect = ref('')
const feedbackWrong = ref('')
const winTitle = ref('')

const questions = ref(generateRound())
const index = ref(0)
const selectedOption = ref<AnimalKey | null>(null)
const result = ref<'correct' | 'wrong' | null>(null)
const isLocked = ref(false)
const hasWon = ref(false)

const currentQuestion = computed(() => questions.value[index.value])

let audio: HTMLAudioElement | null = null
let audioCorrect: HTMLAudioElement | null = null
let audioWrong: HTMLAudioElement | null = null

onMounted(() => {
  audioCorrect = new Audio('/audio/boa.mp3')
  audioWrong = new Audio('/audio/ups.mp3')
  updateTranslations()
  playSound()
})

onBeforeUnmount(() => {
  stopSound()
})

watch(index, () => {
  selectedOption.value = null
  result.value = null
  isLocked.value = false
  playSound()
})

watch(locale, () => {
  updateTranslations()
})

function animalLabel(key: AnimalKey) {
  return t(`games.animals.names.${key}`)
}

function updateTranslations() {
  titleText.value = t('games.animals.title')
  buttonText.value = t('games.animals.button')
  feedbackCorrect.value = t('games.animals.feedback.correct')
  feedbackWrong.value = t('games.animals.feedback.wrong')
  winTitle.value = t('games.animals.winTitle')
}

function generateRound() {
  const targets = sampleUnique(ANIMALS, QUESTIONS_PER_ROUND)
  const qs = targets.map((target) => {
    const distractor = sampleUnique(
      ANIMALS.filter((a) => a.key !== target.key),
      1
    )[0]
    const options = shuffle([
      { key: target.key, image: target.image },
      { key: distractor.key, image: distractor.image },
    ])
    return { sound: target.sound, answer: target.key, options }
  })
  return shuffle(qs)
}

function playSound() {
  if (typeof window === 'undefined') return
  try {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    audio = new Audio(currentQuestion.value.sound)
    audio.play()
  } catch {}
}

async function checkAnswer(selected: AnimalKey) {
  if (isLocked.value) return
  selectedOption.value = selected
  isLocked.value = true

  if (selected === currentQuestion.value.answer) {
    result.value = 'correct'
    await playFeedback({ type: 'correct', text: t('games.animals.feedback.correct') })
    await nextTick()
    if (index.value === questions.value.length - 1) {
      await win()
    } else {
      index.value++
    }
  } else {
    result.value = 'wrong'
    await playFeedback({ type: 'wrong', text: t('games.animals.feedback.wrong') })
    result.value = null
    isLocked.value = false
  }
}

async function win() {
  hasWon.value = true
  stopSound()
  await nextTick()
  launchConfetti()
  speakText(t('common.messages.congrats'))
}

function resetGame() {
  hasWon.value = false
  result.value = null
  selectedOption.value = null
  isLocked.value = false
  index.value = 0
  questions.value = generateRound()
  playSound()
}

function goToGames() {
  stopSound()
  router.push('/games')
}

function stopSound() {
  try {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  } catch {}
}

function playFeedback({ type, text }: { type: 'correct' | 'wrong'; text: string }) {
  return new Promise<void>((resolve) => {
    const audioObj = type === 'correct' ? audioCorrect : audioWrong
    if (audioObj && audioObj.play) {
      try {
        audioObj.currentTime = 0
      } catch {}
      audioObj.onended = () => resolve()
      audioObj.play().catch(() => {
        speakText(text, resolve)
      })
    } else {
      speakText(text, resolve)
    }
  })
}

function speakText(text: string, onend?: () => void) {
  try {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = voice.value
    if (onend) utter.onend = onend
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  } catch {
    if (onend) onend()
  }
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null
  if (!canvas) return
  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
  myConfetti({
    particleCount: 180,
    spread: 90,
    startVelocity: 45,
    gravity: 0.9,
    origin: { x: 0.5, y: 0.5 },
  })
}

function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sampleUnique<T>(pool: readonly T[], n: number) {
  const copy = pool.slice()
  const out: T[] = []
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
.animal-card:hover {
  transform: scale(1.05);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, background-color 0.15s ease;
  cursor: pointer;
}
.btn-mais-uma {
  background-color: #108818;
  color: #fff;
}
.btn-mais-uma:hover {
  background-color: #198e09;
  transform: translateY(-1px);
}
.btn-salir {
  background: #e9ecef;
  color: #333;
}
.btn-salir:hover {
  background: #dee2e6;
  transform: translateY(-1px);
}
</style>
