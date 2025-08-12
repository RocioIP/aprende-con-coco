<template>
  <div
    class="story-container"
    ref="frameEl"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerCancel"
  >
    <div class="story-content" :class="slideClass">
      <div class="story-image">
        <img :src="currentPage.image" alt="Imagem do conto" draggable="false" />
      </div>
      <div class="story-text">
        <h2>{{ currentPage.title }}</h2>
        <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
      </div>
    </div>

    <!-- Pista sutil para deslizar -->
    <div class="swipe-hint">Desliza para continuar</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

/* ======== Páginas do conto (PT-PT) ======== */
const pages = [
  {
    title: "Capítulo 1: O Barco Surpresa",
    image: "/images/stories/barco/cap-1.webp",
    text: `Numa manhã, o Coco encontrou uma carta junto à sua tigela de comida:
"Querido Coco, convidamos-te para uma viagem de barco!
Assinado: Capitão Peixe".

O Coco latiu de alegria e correu até ao cais.
Lá estava um barquinho com uma bandeira a dizer:
"A aventura começa aqui".`,
  },
  {
    title: "Capítulo 2: A baleia que cantava",
    image: "/images/stories/barco/cap-2.webp",
    text: `A navegar pelo mar azul, o Coco ouviu uma melodia.
— Quem canta tão bonito? — perguntou.

Era uma baleia!
— Olá, Coco. Podes ajudar-me a encontrar o meu eco?

O Coco latiu forte e a baleia sorriu ao ouvi-lo a ecoar.
— Obrigada! — disse. — A tua voz deixou-me feliz!`,
  },
  {
    title: "Capítulo 3: O polvo enrolado",
    image: "/images/stories/barco/cap-3.webp",
    text: `Entre ondas suaves, o Coco viu bolhas e... tentáculos!
Um polvo tinha ficado preso numa rede de pesca.
— Não consigo dançar! — lamentou-se.

O Coco roeu a rede e libertou-o.
O polvo deu uma pirueta de alegria:
— És um herói de quatro patas!`,
  },
  {
    title: "Capítulo 4: A tempestade traquina",
    image: "/images/stories/barco/cap-4.webp",
    text: `O céu ficou cinzento. Raios! Trovões!
O Coco escondeu-se debaixo de uma manta no barco.
Mas depois pensou:
— E se as ondas também estiverem assustadas?

Saiu, olhou para o céu e disse:
— Vai correr tudo bem!

E a tempestade... foi-se embora.`,
  },
  {
    title: "Capítulo 5: O tesouro invisível",
    image: "/images/stories/barco/cap-5.webp",
    text: `Uma luz brilhou na água. O Coco seguiu o reflexo...
Mas, ao chegar, só encontrou uma garrafa com um papel:

"O tesouro mais brilhante é ter amigos e ser corajoso".

O Coco sorriu.
— Esta foi a melhor viagem da minha vida!`,
  },
]

/* ======== Estado ======== */
const currentPageIndex = ref(0)
const currentPage = computed(() => pages[currentPageIndex.value])
const paragraphs = computed(() =>
  currentPage.value.text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
)

/* ======== Deslizar (pointer events) ======== */
const frameEl = ref(null)
const startX = ref(0)
const startY = ref(0)
const dragging = ref(false)
const deltaX = ref(0)
const deltaY = ref(0)
const slideDir = ref(null) // 'left' | 'right' | null
const slideClass = computed(() => (slideDir.value ? `slide-${slideDir.value}` : ''))

const SWIPE_THRESHOLD = 60
const MAX_ANGLE = 25

function onPointerDown(e) {
  dragging.value = true
  startX.value = e.clientX
  startY.value = e.clientY
  deltaX.value = 0
  deltaY.value = 0
  frameEl.value?.setPointerCapture?.(e.pointerId)
}
function onPointerMove(e) {
  if (!dragging.value) return
  deltaX.value = e.clientX - startX.value
  deltaY.value = e.clientY - startY.value
  const angle = Math.abs(Math.atan2(deltaY.value, deltaX.value) * 180 / Math.PI)
  if (angle > 90 - MAX_ANGLE && angle < 90 + MAX_ANGLE) return
}
function onPointerUp() {
  if (!dragging.value) return
  const dx = deltaX.value
  const dy = deltaY.value
  dragging.value = false
  slideDir.value = null

  const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI)
  const isHorizontal = angle < MAX_ANGLE || angle > 180 - MAX_ANGLE
  if (!isHorizontal) return

  if (dx <= -SWIPE_THRESHOLD) nextPage()
  else if (dx >= SWIPE_THRESHOLD) prevPage()
}
function onPointerCancel() {
  dragging.value = false
  slideDir.value = null
}

function nextPage() {
  if (currentPageIndex.value >= pages.length - 1) return
  slideDir.value = 'left'
  currentPageIndex.value++
}
function prevPage() {
  if (currentPageIndex.value <= 0) return
  slideDir.value = 'right'
  currentPageIndex.value--
}
</script>

<style scoped>
.story-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem 1rem 2.25rem;
  border: 3px solid #a8c3e5;
  border-radius: 15px;
  background: #f7faff;
  box-shadow: 0 8px 20px rgba(50, 70, 120, 0.15);
  touch-action: pan-y;
}

.story-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  transition: transform .25s ease, opacity .25s ease;
}

.slide-left  { transform: translateX(-16px); opacity: .98; }
.slide-right { transform: translateX( 16px); opacity: .98; }

.story-image { flex: 1; }
.story-image img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(30, 60, 100, 0.2);
  user-select: none;
}

.story-text { flex: 1; font-size: 1.2rem; line-height: 1.6; }
.story-text h2 { margin-bottom: 1rem; color: #486b9f; font-size: 1.8rem; }

.swipe-hint {
  text-align: center;
  margin-top: 1rem;
  color: #6c88b0;
  font-size: .95rem;
  user-select: none;
}

@media (max-width: 768px) {
  .story-content { flex-direction: column; text-align: center; }
}
</style>
