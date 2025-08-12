<template>
  <div class="pizarra-layout">
    <div class="barra-superior" ref="toolbarEl">
      <div class="paleta-horizontal">
        <div
          v-for="color in colores"
          :key="color"
          :style="{ backgroundColor: color }"
          class="color"
          :class="{ activo: color === colorSeleccionado }"
          @click="seleccionarColor(color)"
        />
      </div>
      <button class="btn-limpiar" @click="limpiarCanvas" title="Limpar desenho">
        🧽
      </button>
    </div>

    <div class="contenido-central">
      <div class="mascota-area">
        <img src="/images/blackboard/painter.png" alt="Mascota" class="mascota-img" />
        <div class="botones-mascota">
          <button class="boton-mascota" @click="activarPizarraLibre">✏️ 🎨</button>
          <button class="boton-mascota" @click="juego = 'numeros'">1️⃣2️⃣3️⃣</button>
          <button class="boton-mascota" @click="juego = 'figuras'">🟥⭐🟢</button>
        </div>
      </div>

      <div class="pizarra-area">
        <div class="pizarra-borde" ref="boardEl">
          <!-- PIZARRA LIBRE -->
          <canvas
            v-if="juego === 'ninguno'"
            ref="canvas"
            class="pizarra"
            @touchstart="startDraw"
            @touchmove="draw"
            @touchend="stopDraw"
            @mousedown="startDrawMouse"
            @mousemove="drawMouse"
            @mouseup="stopDraw"
            @mouseleave="stopDraw"
          />

          <!-- JUEGOS -->
          <numbers v-else-if="juego === 'numeros'" @finalizado="juego = 'ninguno'" />
          <figuras v-else-if="juego === 'figuras'" @finalizado="juego = 'ninguno'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from "vue";
import numbers from "@/components/Numbers.vue";
import figuras from "@/components/Figuras.vue";

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);
const juego = ref("ninguno");

const toolbarEl = ref(null);
const boardEl = ref(null);
let ro; // ResizeObserver

const colorSeleccionado = ref("#000000");
const colores = ["#000000", "#ff0000", "#060cb1", "#00bfff", "#32cd32", "#fddf0c", "#f98505", "#800080", "#df0cfd"];

const seleccionarColor = (color) => (colorSeleccionado.value = color);

let lastX = 0,
  lastY = 0;

/* ---------- helpers canvas ---------- */
function sizeCanvasToContainer() {
  const c = canvas.value;
  const board = boardEl.value;
  if (!c || !board) return;

  // Tamaño CSS disponible del contenedor
  const rect = board.getBoundingClientRect();

  // Ajusta el canvas interno con devicePixelRatio para que se vea nítido
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  c.width = Math.floor(rect.width * dpr);
  c.height = Math.floor(rect.height * dpr);
  c.style.width = `${rect.width}px`;
  c.style.height = `${rect.height}px`;

  ctx.value = c.getContext("2d");
  ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0); // escalado lógico -> CSS px
}

function initCanvas() {
  if (!canvas.value) return;
  sizeCanvasToContainer();
}

function activarPizarraLibre() {
  juego.value = "ninguno";
  nextTick(initCanvas);
}

/* Re-inicializa el canvas cada vez que vuelves a “ninguno” */
watch(juego, async (val) => {
  if (val === "ninguno") {
    await nextTick();
    initCanvas();
  }
});

const getCoords = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x, y };
};

const startDraw = (e) => {
  if (!ctx.value) return;
  dibujando.value = true;
  const { x, y } = getCoords(e);
  lastX = x;
  lastY = y;
};

const draw = (e) => {
  if (!dibujando.value || !ctx.value) return;
  e.preventDefault();
  const { x, y } = getCoords(e);
  ctx.value.beginPath();
  ctx.value.moveTo(lastX, lastY);
  ctx.value.lineTo(x, y);
  ctx.value.strokeStyle = colorSeleccionado.value;
  ctx.value.lineWidth = 4;
  ctx.value.lineCap = "round";
  ctx.value.stroke();
  lastX = x;
  lastY = y;
};

const startDrawMouse = startDraw;
const drawMouse = draw;
const stopDraw = () => (dibujando.value = false);

const limpiarCanvas = () => {
  if (!ctx.value || !canvas.value) return;
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

function setupResizeObserver() {
  if (!boardEl.value) return;
  ro = new ResizeObserver(() => {
    if (juego.value === "ninguno") {
      initCanvas();
    }
  });
  ro.observe(boardEl.value);
}

onMounted(() => {
  initCanvas();
  setupResizeObserver();
  // fallback por cambios de orientación
  window.addEventListener("orientationchange", initCanvas);
  window.addEventListener("resize", initCanvas);
});

onBeforeUnmount(() => {
  if (ro && boardEl.value) ro.unobserve(boardEl.value);
  window.removeEventListener("orientationchange", initCanvas);
  window.removeEventListener("resize", initCanvas);
});
</script>

<style scoped>
.pizarra-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* Barra superior */
.barra-superior {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  gap: 1rem;
  background-color: #f9f9f9;
}

/* Paleta */
.paleta-horizontal {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
.color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #aaa;
  cursor: pointer;
  transition: transform 0.2s;
}
.color.activo {
  transform: scale(1.2);
  border: 3px solid #333;
}

.btn-limpiar {
  font-size: 2rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.btn-limpiar:hover {
  transform: scale(1.2);
}

/* Cuerpo */
.contenido-central {
  display: flex;
  flex: 1;
  padding: 1rem;
  gap: 1rem;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  overflow: auto; /* permite scroll si hace falta */
}

.mascota-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 220px;
  flex: 0 0 auto;
}
.mascota-img {
  width: 100%;
  max-width: 150px;
  height: auto;
}
.botones-mascota {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}
.boton-mascota {
  padding: 0.5rem 1rem;
  font-size: 2rem;
  border: none;
  background-color: #5c7080;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.boton-mascota:hover {
  background-color: #394b59;
}

/* Pizarra */
.pizarra-area {
  flex: 1 1 320px;
  max-width: 1000px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pizarra-borde {
  /* Ocupa todo el ancho disponible del contenedor y ajusta la altura por viewport */
  width: 100%;
  height: clamp(320px, 75dvh, 800px); /* desktop */
  border: 8px solid #5c7080;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.pizarra {
  width: 100%;
  height: 100%;
  touch-action: none;
  display: block;
  background: white;
  cursor: crosshair;
}

/* Móvil: la pizarra usa más alto y la mascota pasa arriba */
@media (max-width: 820px) {
  .contenido-central {
    flex-direction: column;
    align-items: stretch;
  }

  .mascota-area {
    max-width: 100%;
    align-items: center;
    flex-direction: row;
  }

  .pizarra-borde {
    height: clamp(260px, 70dvh, 85dvh); /* más alto en móvil */
  }
  .botones-mascota {
  flex-direction: row;
}
}
</style>
