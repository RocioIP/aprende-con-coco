<template>
  <div class="game-container" ref="containerEl">
    <div class="topbar">
      <div class="levels">
        <button
          class="lvl-btn"
          :class="{ active: level === 1 }"
          @click="switchLevel(1)"
        >
          {{ t('games.balloons.levelOne') }}
        </button>
        <button
          class="lvl-btn"
          :class="{ active: level === 2 }"
          @click="switchLevel(2)"
        >
          {{ t('games.balloons.levelTwo') }}
        </button>
      </div>
    </div>

    <h3 v-if="!hasWon" class="display-6 fw-bold text-center mt-3">
      {{ t('games.balloons.instruction') }}
      <span
        v-if="targetColor"
        :style="{ color: targetColor, fontWeight: 'bold' }"
      >
        {{ targetColorLabel }}
      </span>
      <span v-if="level === 2 && targetSize" class="badge-size">
        {{ targetSizeLabel }}
      </span>
    </h3>

    <div ref="boardEl" class="balloons-board position-relative mx-auto">
      <Balloon
        v-for="b in balloons"
        :key="b.id"
        :x="b.x"
        :y="b.y"
        :color="b.color"
        :letter="b.letter"
        :size="b.size"
        :targetColor="targetColor"
        :targetSize="level === 2 ? targetSize : null"
        @correct="({ x, y, color, size }) => handleCorrect(color, size, x, y)"
        @wrong="handleWrong"
      />
    </div>

    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">
          🎉 {{ t('common.messages.congrats') }}
        </h1>
        <img
          src="/images/global/coco-aplaudiendo.webp"
          alt="Coco aplaudindo"
          class="img-coco-aplaudiendo"
        />
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">
            🎈 {{ t('common.buttons.playAgain') }}
          </button>
          <button class="btn-salir" @click="goToGames">
            ✖ {{ t('common.buttons.close') }}
          </button>
        </div>
      </div>
      <canvas id="confetti-canvas" class="confetti-canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'
import Balloon from '@/components/atoms/Balloon.vue'
import { speechVoices } from '@/lang'

const router = useRouter()
const { t, locale } = useI18n()
const voice = computed(() => speechVoices[locale.value] ?? speechVoices.es)

const vowels = ['A', 'E', 'I', 'O', 'U'] as const
const colorByVowel = {
  A: '#FF6B6B',
  E: '#FFD93D',
  I: '#4D96FF',
  O: '#6BCB77',
  U: '#FF8000',
} as const
type ColorHex = typeof colorByVowel[keyof typeof colorByVowel]
type ColorNameKey = 'red' | 'yellow' | 'blue' | 'green' | 'orange'
const colorKeyByHex: Record<ColorHex, ColorNameKey> = {
  '#FF6B6B': 'red',
  '#FFD93D': 'yellow',
  '#4D96FF': 'blue',
  '#6BCB77': 'green',
  '#FF8000': 'orange',
}

const LEVEL2_SIZES = ['grande', 'pequeno'] as const
type BalloonSize = (typeof LEVEL2_SIZES)[number]
const sizeKeyMap: Record<BalloonSize, 'large' | 'small'> = {
  grande: 'large',
  pequeno: 'small',
}

interface BalloonItem {
  id: string
  letter: (typeof vowels)[number]
  color: ColorHex
  x: number
  y: number
  size: BalloonSize
}

const level = ref<1 | 2>(1)
const balloons = ref<BalloonItem[]>([])
const targetColor = ref<ColorHex | ''>('')
const targetSize = ref<BalloonSize | null>(null)
const usedColors = ref<ColorHex[]>([])
const removedColors = ref<ColorHex[]>([])
const hasWon = ref(false)

const containerEl = ref<HTMLDivElement | null>(null)
const boardEl = ref<HTMLDivElement | null>(null)
let errorSound: HTMLAudioElement | null = null

const targetColorLabel = computed(() =>
  targetColor.value ? colorLabel(targetColor.value) : ''
)
const targetSizeLabel = computed(() =>
  targetSize.value
    ? t(`games.balloons.sizes.${sizeKeyMap[targetSize.value]}`)
    : ''
)

function colorLabel(hex: ColorHex | '') {
  if (!hex) return ''
  const key = colorKeyByHex[hex as ColorHex]
  return key ? t(`games.balloons.colors.${key}`) : ''
}

onMounted(() => {
  errorSound = new Audio('/sounds/error.mp3')
  initGame()
})

watch(level, () => {
  resetGame()
})

function initGame() {
  balloons.value = []
  hasWon.value = false
  usedColors.value = []
  removedColors.value = []
  targetColor.value = ''
  targetSize.value = null
  placeBalloons()
  requestAnimationFrame(() => {
    containerEl.value?.scrollTo({ top: 0, behavior: 'auto' })
  })
  pickNextTarget()
}

function placeBalloons() {
  const margin = 12
  const boardRect = boardEl.value?.getBoundingClientRect()
  const boardW = boardRect?.width || Math.min(window.innerWidth, 900)
  const boardH = 900

  const CLUSTER_PADDING_TOP = 80
  const CLUSTER_HEIGHT = 520
  const CLUSTER_WIDTH_RATIO = 0.85

  const clusterW = boardW * CLUSTER_WIDTH_RATIO
  const clusterH = Math.min(CLUSTER_HEIGHT, boardH - CLUSTER_PADDING_TOP - 40)
  const clusterX0 = (boardW - clusterW) / 2
  const clusterY0 = CLUSTER_PADDING_TOP

  const positions: Array<{ x: number; y: number; w: number; h: number }> = []

  const isOverlapping = (x: number, y: number, w: number, h: number) =>
    positions.some(
      (pos) =>
        Math.abs(pos.x - x) < (pos.w + w) / 2 + margin &&
        Math.abs(pos.y - y) < (pos.h + h) / 2 + margin
    )

  const dims = (size: BalloonSize) =>
    size === 'pequeno' ? { w: 75, h: 90 } : { w: 100, h: 120 }

  balloons.value = []

  if (level.value === 1) {
    vowels.forEach((letter, idx) => {
      const size: BalloonSize = 'grande'
      const { w, h } = dims(size)
      let x: number
      let y: number
      let tries = 0
      do {
        x = Math.random() * (clusterW - w) + clusterX0
        y = Math.random() * (clusterH - h) + clusterY0
        tries++
      } while (isOverlapping(x, y, w, h) && tries < 200)
      positions.push({ x, y, w, h })
      balloons.value.push({
        id: `L1-${idx}`,
        letter,
        color: colorByVowel[letter],
        x,
        y,
        size,
      })
    })
  } else {
    let idc = 0
    vowels.forEach((letter) => {
      LEVEL2_SIZES.forEach((size) => {
        const { w, h } = dims(size)
        let x: number
        let y: number
        let tries = 0
        do {
          x = Math.random() * (clusterW - w) + clusterX0
          y = Math.random() * (clusterH - h) + clusterY0
          tries++
        } while (isOverlapping(x, y, w, h) && tries < 300)
        positions.push({ x, y, w, h })
        balloons.value.push({
          id: `L2-${idc++}`,
          letter,
          color: colorByVowel[letter],
          x,
          y,
          size,
        })
      })
    })
  }
}

const pickNextTarget = async () => {
  if (level.value === 1) {
    const remainingColors = balloons.value
      .map((b) => b.color)
      .filter((color) => !usedColors.value.includes(color))
    if (remainingColors.length === 0) {
      await win()
      return
    }
    const next =
      remainingColors[Math.floor(Math.random() * remainingColors.length)]
    targetColor.value = next
    targetSize.value = null
    speakInstruction()
  } else {
    const remaining = balloons.value.filter(
      (b) => !removedColors.value.includes(b.color)
    )
    if (remaining.length === 0) {
      await win()
      return
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)]
    targetColor.value = pick.color
    targetSize.value = pick.size
    speakInstruction()
  }
}

async function win() {
  hasWon.value = true
  await nextTick()
  launchConfetti()
  speakText(t('common.messages.congrats'))
}

function switchLevel(lvl: 1 | 2) {
  if (level.value === lvl) return
  level.value = lvl
}

const handleCorrect = (color: ColorHex, _size: BalloonSize, centerX: number, centerY: number) => {
  popConfettiAt(centerX, centerY)

  balloons.value = balloons.value.filter((b) => b.color !== color)

  if (level.value === 1) {
    if (!usedColors.value.includes(color)) usedColors.value.push(color)
  } else {
    if (!removedColors.value.includes(color)) removedColors.value.push(color)
  }

  pickNextTarget()
}

const handleWrong = () => {
  if (!errorSound) return
  errorSound.currentTime = 0
  errorSound.play()
}

function speakInstruction() {
  if (!targetColor.value) return
  if (level.value === 1) {
    const text = t('games.balloons.speakColor', {
      color: targetColorLabel.value,
    })
    speakText(text)
  } else if (targetSize.value) {
    const text = t('games.balloons.speakColorSize', {
      color: targetColorLabel.value,
      size: targetSizeLabel.value,
    })
    speakText(text)
  }
}

function speakText(text: string) {
  if (!import.meta.client) return
  const trimmed = text?.trim()
  if (!trimmed) return
  const u = new SpeechSynthesisUtterance(trimmed)
  u.lang = voice.value
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas') as
    | HTMLCanvasElement
    | null
  if (canvas) {
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })
    myConfetti({
      particleCount: 220,
      spread: 100,
      startVelocity: 45,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 },
    })
  } else {
    confetti({
      particleCount: 220,
      spread: 100,
      startVelocity: 45,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 },
    })
  }
}

function popConfettiAt(centerX: number, centerY: number) {
  const rect = boardEl.value?.getBoundingClientRect()
  if (!rect) return
  const clientX = rect.left + centerX
  const clientY = rect.top + centerY
  const originX = clientX / window.innerWidth
  const originY = clientY / window.innerHeight

  confetti({
    particleCount: 70,
    spread: 60,
    startVelocity: 35,
    gravity: 0.9,
    ticks: 120,
    origin: { x: originX, y: originY },
  })
}

async function resetGame(speak = true) {
  hasWon.value = false
  usedColors.value = []
  removedColors.value = []
  targetColor.value = ''
  targetSize.value = null
  balloons.value = []
  await nextTick()
  placeBalloons()
  if (speak) pickNextTarget()
}

function goToGames() {
  router.push('/games')
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
.topbar {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}
.levels {
  display: flex;
  gap: 0.5rem;
}
.lvl-btn {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-weight: 700;
  background: #e9ecef;
  cursor: pointer;
}
.lvl-btn.active {
  background: #0d6efd;
  color: #fff;
}

.badge-size {
  margin-left: 0.5rem;
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #f1f3f5;
  font-weight: 800;
  text-transform: capitalize;
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

@media (max-width: 600px) {
  .img-coco-aplaudiendo {
    width: 45vw;
  }
  .btn-mais-uma,
  .btn-salir {
    padding: 0.55rem 1.1rem;
  }
}
</style>
