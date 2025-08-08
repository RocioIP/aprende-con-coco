<template>
  <div class="game-container" ref="containerEl">
    <h3 v-if="!hasWon" class="display-5 fw-bold text-center mt-3">
      Toca no balão colorido
      <span :style="{ color: targetColor, fontWeight: 'bold' }">
        {{ colorNames[targetColor] }}
      </span>
    </h3>

    <div ref="boardEl" class="balloons-board position-relative mx-auto">
      <Balloon
        v-for="(b, index) in balloons"
        :key="index"
        :x="b.x"
        :y="b.y"
        :color="b.color"
        :letter="b.letter"
        :targetColor="targetColor"
        @correct="({ x, y }) => handleCorrect(b.color, x, y)"
        @wrong="handleWrong"
      />
    </div>

    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">¡Boa Eduardo! 🎉</h1>
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
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Balloon from '@/components/Balloon.vue'
import confetti from 'canvas-confetti'

const router = useRouter()

const balloons = ref([])
const targetColor = ref('')
const usedColors = ref([])
const hasWon = ref(false)

const containerEl = ref(null)
const boardEl = ref(null)

const vowels = ['A', 'E', 'I', 'O', 'U']
const colorByVowel = {
  A: '#FF6B6B',
  E: '#FFD93D',
  I: '#4D96FF',
  O: '#6BCB77',
  U: '#FF8000',
}
const colorNames = {
  '#FF6B6B': 'vermelho',
  '#FFD93D': 'amarelo',
  '#4D96FF': 'azul',
  '#6BCB77': 'verde',
  '#FF8000': 'laranja',
}

let errorSound

onMounted(() => {
  errorSound = new Audio('/sounds/error.mp3')
  initGame()
})

function initGame() {
  const balloonWidth = 100
  const balloonHeight = 120
  const cuerdaExtra = 40
  const margin = 12

  const boardRect = boardEl.value?.getBoundingClientRect()
  const boardW = boardRect?.width || Math.min(window.innerWidth, 900)
  const boardH = 900

  const CLUSTER_PADDING_TOP = 80
  const CLUSTER_HEIGHT = 520
  const CLUSTER_WIDTH_RATIO = 0.8

  const clusterW = boardW * CLUSTER_WIDTH_RATIO
  const clusterH = Math.min(CLUSTER_HEIGHT, boardH - CLUSTER_PADDING_TOP - 40)
  const clusterX0 = (boardW - clusterW) / 2
  const clusterY0 = CLUSTER_PADDING_TOP

  const maxX = clusterX0 + clusterW - balloonWidth - margin
  const maxY = clusterY0 + clusterH - balloonHeight - cuerdaExtra - margin

  const positions = []
  const isOverlapping = (x, y) =>
    positions.some(
      pos =>
        Math.abs(pos.x - x) < balloonWidth + margin &&
        Math.abs(pos.y - y) < balloonHeight + margin
    )

  balloons.value = []
  hasWon.value = false
  usedColors.value = []
  targetColor.value = ''

  vowels.forEach(letter => {
    let tries = 0
    let x, y
    do {
      x = Math.random() * (maxX - clusterX0) + clusterX0
      y = Math.random() * (maxY - clusterY0) + clusterY0
      tries++
    } while (isOverlapping(x, y) && tries < 100)

    positions.push({ x, y })
    balloons.value.push({ letter, color: colorByVowel[letter], x, y })
  })

  requestAnimationFrame(() => {
    containerEl.value?.scrollTo({ top: 0, behavior: 'instant' })
  })

  pickNextTarget()
}

const pickNextTarget = async () => {
  const remaining = balloons.value
    .map(b => b.color)
    .filter(c => !usedColors.value.includes(c))

  if (remaining.length > 0) {
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    targetColor.value = next
    speakText(`Toca no balão colorido ${colorNames[next]}`)
  } else {
    hasWon.value = true
    await nextTick()
    speakText('Boa Eduardo!')
    launchConfetti()
  }
}

function speakText(text) {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-PT'
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

function popConfettiAt(centerX, centerY) {
  const rect = boardEl.value?.getBoundingClientRect()
  if (!rect) return
  const clientX = rect.left + centerX
  const clientY = rect.top + centerY
  const originX = clientX / window.innerWidth
  const originY = clientY / window.innerHeight

  confetti({
    particleCount: 60,
    spread: 55,
    startVelocity: 35,
    gravity: 0.9,
    ticks: 120,
    origin: { x: originX, y: originY }
  })
}

async function resetGame() {
  hasWon.value = false
  usedColors.value = []
  targetColor.value = ''
  balloons.value = []
  await nextTick()
  initGame()
}

function goToGames() {
  router.push('/games')
}

const handleCorrect = (color, centerX, centerY) => {
  usedColors.value.push(color)
  popConfettiAt(centerX, centerY)
  pickNextTarget()
}

const handleWrong = () => {
  errorSound.currentTime = 0
  errorSound.play()
}
</script>

<style scoped>
.game-container {
  width: 100vw;
  min-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 2rem;
}

.balloons-board {
  width: min(100%, 900px);
  min-height: 900px;
  margin: 1rem auto 2rem;
  position: relative;
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

@media (max-width: 600px) {
  .img-coco-aplaudiendo { width: 45vw; }
  .btn-mais-uma, .btn-salir { padding: 0.55rem 1.1rem; }
}
</style>
