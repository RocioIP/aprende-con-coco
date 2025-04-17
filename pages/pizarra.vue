<template>
  <div class="pizarra-layout">
    <!-- Mascota (izquierda) -->
    <div class="mascota-area">
      <img src="/imagenes/pintor.png" alt="Mascota" class="mascota-img" />
    </div>

    <!-- Área de la pizarra (centro) -->
    <div class="pizarra-area">
      <div class="pizarra-borde">
        <canvas
          ref="canvas"
          class="pizarra"
          @touchstart="startDraw"
          @touchmove="draw"
          @touchend="stopDraw"
          @mousedown="startDrawMouse"
          @mousemove="drawMouse"
          @mouseup="stopDraw"
          @mouseleave="stopDraw"
        ></canvas>
      </div>
    </div>

    <!-- Paleta de colores y goma (derecha) -->
    <div class="herramientas">
      <div class="paleta-vertical">
        <div
          v-for="color in colores"
          :key="color"
          :style="{ backgroundColor: color }"
          class="color"
          :class="{ activo: color === colorSeleccionado }"
          @click="seleccionarColor(color)"
        />
      </div>
      <button class="btn-limpiar" @click="limpiarCanvas" title="Limpiar dibujo">
        🧽
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);
const colorSeleccionado = ref("#000000");

const colores = [
  "#000000",
  "#ff0000",
  "#060cb1",
  "#00bfff",
  "#32cd32",
  "#fddf0c",
  "#f98505",
  "#800080",
  "#df0cfd",
];

let lastX = 0;
let lastY = 0;

// --- Selección de color ---
const seleccionarColor = (color) => {
  colorSeleccionado.value = color;
};

// --- Dibujo con el dedo (touch) ---
const getCoords = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

const startDraw = (e) => {
  dibujando.value = true;
  const { x, y } = getCoords(e);
  lastX = x;
  lastY = y;
};

const draw = (e) => {
  if (!dibujando.value) return;
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

// --- Dibujo con el mouse (desktop) ---
const startDrawMouse = (e) => {
  dibujando.value = true;
  const rect = canvas.value.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
};

const drawMouse = (e) => {
  if (!dibujando.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

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

const stopDraw = () => {
  dibujando.value = false;
};

// --- Limpiar canvas ---
const limpiarCanvas = () => {
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

// --- Inicialización ---
onMounted(() => {
  const canvasEl = canvas.value;
  canvasEl.width = canvasEl.offsetWidth;
  canvasEl.height = canvasEl.offsetHeight;
  ctx.value = canvasEl.getContext("2d");
});
</script>

<style scoped>
.pizarra-layout {
  display: flex;
  height: 80vh;
}

.mascota-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.mascota-img {
  max-width: 100%;
  max-height: 60%;
  object-fit: contain;
}

.pizarra-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pizarra-borde {
  width: 100%;
  max-width: 900px;
  aspect-ratio: 4 / 3;
  border: 8px solid #5c7080;
  border-radius: 12px;
  background-color: #ffffff;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.pizarra {
  width: 100%;
  height: 100%;
  touch-action: none;
  display: block;
  background: white;
  cursor: crosshair;
}

.herramientas {
  flex: 0.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1rem;
}

.paleta-vertical {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
</style>
