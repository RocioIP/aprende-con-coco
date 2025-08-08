<template>
  <div class="pizarra-layout">
    <div class="barra-superior">
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
        <img
          src="/images/blackboard/painter.png"
          alt="Mascota"
          class="mascota-img"
        />
        <div class="botones-mascota">
          <button class="boton-mascota" @click="activarPizarraLibre">
            ✏️ Pizarra libre
          </button>
          <button class="boton-mascota" @click="juego = 'numeros'">
            Repasa os números
          </button>
          <button class="boton-mascota" @click="juego = 'figuras'">
            Repasa as figuras
          </button>
        </div>
      </div>

      <div class="pizarra-area">
        <div class="pizarra-borde">
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
          <numbers
            v-else-if="juego === 'numeros'"
            @finalizado="juego = 'ninguno'"
          />
          <figuras
            v-else-if="juego === 'figuras'"
            @finalizado="juego = 'ninguno'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import numbers from "@/components/Numbers.vue";
import figuras from "@/components/Figuras.vue";

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);
const juego = ref("ninguno");

const colorSeleccionado = ref("#000000");
const colores = [
  "#000000", "#ff0000", "#060cb1", "#00bfff",
  "#32cd32", "#fddf0c", "#f98505", "#800080", "#df0cfd",
];

const seleccionarColor = (color) => { colorSeleccionado.value = color; };

let lastX = 0, lastY = 0;

/* ---------- helpers canvas ---------- */
function initCanvas() {
  const c = canvas.value;
  if (!c) return;
  // Ajusta el tamaño interno al tamaño mostrado (alta nitidez)
  c.width = c.offsetWidth;
  c.height = c.offsetHeight;
  ctx.value = c.getContext("2d");
}

function activarPizarraLibre() {
  juego.value = "ninguno";
  // Espera a que el canvas exista y lo inicializa
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
  lastX = x; lastY = y;
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
  lastX = x; lastY = y;
};

const startDrawMouse = startDraw;
const drawMouse = draw;

const stopDraw = () => { dibujando.value = false; };

const limpiarCanvas = () => {
  if (!ctx.value || !canvas.value) return;
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
};

onMounted(() => {
  initCanvas();
  // Opcional: re-calcular tamaño si cambia la ventana
  window.addEventListener("resize", initCanvas);
});
</script>

<style scoped>
.pizarra-layout { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

.barra-superior {
  display: flex; justify-content: center; align-items: center;
  flex-wrap: wrap; padding: 1rem; gap: 1rem; background-color: #f9f9f9;
}

.paleta-horizontal { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; align-items: center; }

.color { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #aaa; cursor: pointer; transition: transform .2s; }
.color.activo { transform: scale(1.2); border: 3px solid #333; }

.btn-limpiar { font-size: 2rem; background: transparent; border: none; cursor: pointer; transition: transform .2s; }
.btn-limpiar:hover { transform: scale(1.2); }

.contenido-central {
  display: flex; flex: 1; max-height: calc(100dvh - 100px);
  overflow: hidden; padding: 1rem; gap: 1.5rem; justify-content: center; align-items: flex-start; flex-wrap: wrap;
}

.mascota-area { display: flex; flex-direction: column; align-items: center; max-width: 200px; }
.mascota-img { width: 100%; max-width: 150px; height: auto; }

.botones-mascota { display: flex; flex-direction: column; gap: .5rem; margin-top: 1rem; }
.boton-mascota {
  padding: .5rem 1rem; font-size: 1rem; border: none; background-color: #5c7080;
  color: white; border-radius: 6px; cursor: pointer; transition: background-color .2s ease;
}
.boton-mascota:hover { background-color: #394b59; }

.pizarra-area { flex: 1; min-width: 300px; max-width: 1000px; display: flex; align-items: center; justify-content: center; }

.pizarra-borde {
  width: 100%; max-height: 70vh; aspect-ratio: 4 / 3;
  border: 8px solid #5c7080; border-radius: 12px; background: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,.2); overflow: hidden;
}

.pizarra { width: 100%; height: 100%; touch-action: none; display: block; background: white; cursor: crosshair; }

@media (max-width: 768px) {
  .contenido-central { flex-direction: column; align-items: center; }
  .mascota-area { max-width: 100%; }
  .pizarra-borde { aspect-ratio: 1 / 1; }
}
</style>
