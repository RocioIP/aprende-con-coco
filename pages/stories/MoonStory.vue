<template>
  <div
    class="storybook"
    ref="frameEl"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerCancel"
  >
    <div class="book-container" :class="slideClass">
      <!-- Página esquerda: Imagem -->
      <div class="page left-page">
        <img :src="currentPage.image" alt="Imagem do conto" draggable="false" />
      </div>

      <!-- Página direita: Texto -->
      <div class="page right-page">
        <div class="story-text">
          <h2 class="chapter-title">{{ currentPage.title }}</h2>
          <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
        </div>
      </div>
    </div>

    <!-- Pista para deslizar -->
    <div class="swipe-hint">Desliza para continuar</div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

/* ======== Conteúdo do conto (PT-PT) ======== */
const pages = [
  {
    title: "Capítulo 1: Um desejo debaixo das estrelas",
    image: "/images/stories/luna/cap-1.webp",
    text: `Nessa noite, o Coco olhava o céu da sua caminha.

— Que bonita está a lua! — suspirou.

Fechou os olhos e pensou: "E se eu pudesse ir lá acima?"
Sem saber como, começou a sonhar… e a sua cama transformou-se numa nave espacial!`,
  },
  {
    title: "Capítulo 2: Fato de astronauta",
    image: "/images/stories/luna/cap-2.webp",
    text: `No sonho, o Coco viu-se diante de um espelho com um fato espacial: capacete, botas grandes e um botão que dizia “Descolar!”.

— Estou pronto para a minha aventura lunar! — disse, aos saltinhos.

Carregou no botão… e a nave começou a rugir.`,
  },
  {
    title: "Capítulo 3: Voo entre estrelas",
    image: "/images/stories/luna/cap-3.webp",
    text: `A nave voou suavemente entre as estrelas. O Coco acenava a cometas, corria com meteoritos e até bateu a pata com um satélite simpático.

— Isto é ainda mais bonito do que imaginava! — latiu feliz.`,
  },
  {
    title: "Capítulo 4: Patas na Lua",
    image: "/images/stories/luna/cap-4.webp",
    text: `Ao chegar, o Coco saltou e começou a flutuar na Lua como se fosse uma mola.

— Estou a flutuar! Que divertido!

Ali conheceu uma estrela tímida que lhe disse:

— Pensava que os sonhos eram só coisas de humanos… mas tu mostraste-me que não!`,
  },
  {
    title: "Capítulo 5: O melhor despertar",
    image: "/images/stories/luna/cap-5.webp",
    text: `O Coco acordou com o nariz na almofada e um sorriso enorme.

Olhou o céu pela janela.

— Às vezes sonhar é o primeiro passo para voar alto — disse.

E desde esse dia, o Coco nunca deixou de imaginar… porque sabia que os sonhos também se treinam.`,
  },
];

/* ======== Estado ======== */
const currentPageIndex = ref(0);
const currentPage = computed(() => pages[currentPageIndex.value]);
const paragraphs = computed(() =>
  currentPage.value.text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
);

/* ======== Swipe ======== */
const frameEl = ref(null);
const startX = ref(0);
const startY = ref(0);
const dragging = ref(false);
const deltaX = ref(0);
const deltaY = ref(0);
const slideDir = ref(null);
const slideClass = computed(() =>
  slideDir.value ? `slide-${slideDir.value}` : ""
);

const SWIPE_THRESHOLD = 60;
const MAX_ANGLE = 25;

function onPointerDown(e) {
  dragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  deltaX.value = 0;
  deltaY.value = 0;
  frameEl.value?.setPointerCapture?.(e.pointerId);
}
function onPointerMove(e) {
  if (!dragging.value) return;
  deltaX.value = e.clientX - startX.value;
  deltaY.value = e.clientY - startY.value;
  const angle = Math.abs((Math.atan2(deltaY.value, deltaX.value) * 180) / Math.PI);
  if (angle > 90 - MAX_ANGLE && angle < 90 + MAX_ANGLE) return;
}
function onPointerUp() {
  if (!dragging.value) return;
  const dx = deltaX.value;
  const dy = deltaY.value;
  dragging.value = false;
  slideDir.value = null;

  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  const isHorizontal = angle < MAX_ANGLE || angle > 180 - MAX_ANGLE;
  if (!isHorizontal) return;

  if (dx <= -SWIPE_THRESHOLD) nextPage();
  else if (dx >= SWIPE_THRESHOLD) prevPage();
}
function onPointerCancel() {
  dragging.value = false;
  slideDir.value = null;
}

function nextPage() {
  if (currentPageIndex.value >= pages.length - 1) return;
  slideDir.value = "left";
  currentPageIndex.value++;
}
function prevPage() {
  if (currentPageIndex.value <= 0) return;
  slideDir.value = "right";
  currentPageIndex.value--;
}
</script>

<style scoped>
.storybook {
  max-width: 900px;
  margin: 2rem auto;
  background: linear-gradient(to bottom right, #d6e4f0, #e8ecf9);
  border: 5px double #6c88b0;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(33, 60, 96, 0.3);
  padding: 1rem;
  font-family: "Georgia", serif;
  overflow: hidden;
  touch-action: pan-y;
}

.book-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-left {
  transform: translateX(-16px);
  opacity: 0.98;
}
.slide-right {
  transform: translateX(16px);
  opacity: 0.98;
}

.page {
  flex: 1;
  padding: 1rem;
  min-height: 400px;
  background: #f0f6ff;
  border: 2px solid #a8c3e5;
  box-shadow: inset 0 0 10px rgba(80, 120, 180, 0.1);
  border-radius: 12px;
}

.left-page img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(30, 60, 100, 0.2);
}

.right-page .story-text {
  font-size: 1.1rem;
  line-height: 1.7;
  text-align: justify;
  text-indent: 1.5rem;
  padding-right: 0.5rem;
  color: #2c3e50;
}

.chapter-title {
  font-family: "Caveat", cursive;
  font-size: 1.8rem;
  color: #486b9f;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(150, 180, 255, 0.5);
}

.swipe-hint {
  text-align: center;
  margin-top: 1rem;
  color: #6c88b0;
  font-size: 0.95rem;
  user-select: none;
}

@media (max-width: 768px) {
  .book-container {
    flex-direction: column;
  }

  .page {
    margin: 0.5rem auto;
    width: 100%;
    min-height: 300px;
  }
}
</style>
