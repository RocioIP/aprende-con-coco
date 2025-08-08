<template>
  <div class="juego-container">
    <canvas
      ref="canvas"
      class="pizarra"
      @touchstart="startDraw"
      @touchmove="draw"
      @touchend="stopDraw"
      @mousedown="startDrawMouse"
      @mousemove="draw"
      @mouseup="stopDraw"
      @mouseleave="stopDraw"
    ></canvas>

    <!-- Imagen a la derecha cuando se completa -->
    <div v-if="estado === 'completado'" class="imagen-figura">
      <img
        :src="`/images/blackboard/figuras/${imagenes[figuras[figuraActual]]}`"
        alt="Figura relacionada"
      />
    </div>

    <div v-if="estado === 'finalizado'" class="reset-overlay">
      <button class="reset-button" @click="reiniciarJuego">
        Volver a empezar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import confetti from "canvas-confetti";

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);

const figuras = ["circulo", "cuadrado", "triangulo", "rectangulo", "estrella", "corazon"];

const imagenes = {
  circulo: "bola.png",
  cuadrado: "conto.png",
  triangulo: "montana.png",
  rectangulo: "tv.png",
  estrella: "estrella.png",
  corazon: "corazon.png",
};

const figuraActual = ref(0);
const puntos = ref([]);
const puntosVisitados = ref(new Set());
const umbral = 25;
const estado = ref("puntos");

const DOT_SPACING = 30;
const DOT_RADIUS = 10;

function sampleLine(x1, y1, x2, y2, spacing = DOT_SPACING) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const n = Math.max(1, Math.floor(len / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x1 + dx * t, y1 + dy * t]);
  }
  return out;
}

onMounted(() => {
  const c = canvas.value;
  c.width = c.offsetWidth;
  c.height = c.offsetHeight;
  ctx.value = c.getContext("2d");
  iniciarFigura();
});

const iniciarFigura = () => {
  estado.value = "puntos";
  puntos.value = [];
  puntosVisitados.value = new Set();
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const width = canvas.value.width;
  const height = canvas.value.height;

  // figura un poco más cerca del centro
  const cx = width * 0.42;
  const cy = height / 2;
  const size = Math.min(width, height) * 0.18;

  const shapes = {
    circulo: Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * 2 * Math.PI;
      return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
    }),

    cuadrado: [
      ...sampleLine(cx - size, cy - size, cx + size, cy - size),
      ...sampleLine(cx + size, cy - size, cx + size, cy + size),
      ...sampleLine(cx + size, cy + size, cx - size, cy + size),
      ...sampleLine(cx - size, cy + size, cx - size, cy - size),
    ],

    rectangulo: [
      ...sampleLine(cx - size, cy - size / 1.5, cx + size, cy - size / 1.5),
      ...sampleLine(cx + size, cy - size / 1.5, cx + size, cy + size / 1.5),
      ...sampleLine(cx + size, cy + size / 1.5, cx - size, cy + size / 1.5),
      ...sampleLine(cx - size, cy + size / 1.5, cx - size, cy - size / 1.5),
    ],

    triangulo: (() => {
      const p1 = [cx, cy - size];
      const p2 = [cx + size, cy + size];
      const p3 = [cx - size, cy + size];
      return [
        ...sampleLine(...p1, ...p2),
        ...sampleLine(...p2, ...p3),
        ...sampleLine(...p3, ...p1),
      ];
    })(),

    estrella: (() => {
      const outerR = size;
      const innerR = size * 0.55;
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      const outline = [];
      for (let i = 0; i < points.length; i++) {
        outline.push(...sampleLine(...points[i], ...points[(i + 1) % points.length]));
      }
      return outline;
    })(),

    corazon: (() => {
      const pts = [];
      const steps = 28; // menos puntos para más separación
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([cx + (x * size) / 16, cy + (y * size) / 13]);
      }
      return pts;
    })(),
  };

  const path = shapes[figuras[figuraActual.value]];
  path.forEach(([x, y]) => puntos.value.push({ x, y }));

  puntos.value.forEach((p) => {
    ctx.value.beginPath();
    ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.value.fillStyle = "rgba(0,0,0,0.15)";
    ctx.value.fill();
  });

  speakText(`Repasa o ${figuras[figuraActual.value]}`);
};

const getCoords = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x, y };
};

const startDraw = (e) => {
  if (estado.value !== "puntos") return;
  dibujando.value = true;
  const { x, y } = getCoords(e);
  verificarPunto(x, y);
};
const startDrawMouse = startDraw;

const draw = (e) => {
  if (!dibujando.value || estado.value !== "puntos") return;
  e.preventDefault();
  const { x, y } = getCoords(e);
  verificarPunto(x, y);
};
const stopDraw = () => {
  dibujando.value = false;
};

const verificarPunto = (x, y) => {
  if (estado.value !== "puntos") return;

  puntos.value.forEach((p, index) => {
    if (!puntosVisitados.value.has(index)) {
      if (Math.hypot(p.x - x, p.y - y) < umbral) {
        puntosVisitados.value.add(index);
        ctx.value.beginPath();
        ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.value.fillStyle = "#32cd32";
        ctx.value.fill();
      }
    }
  });

  if (puntosVisitados.value.size === puntos.value.length) {
    completarFigura();
  }
};

const completarFigura = async () => {
  estado.value = "completado";
  lanzarConfeti();

  await nextTick();

  if (figuraActual.value < figuras.length - 1) {
    setTimeout(() => {
      figuraActual.value++;
      iniciarFigura();
    }, 2000);
  } else {
    setTimeout(() => {
      speakText("Moi ben!");
      estado.value = "finalizado";
    }, 1500);
  }
};

const reiniciarJuego = () => {
  figuraActual.value = 0;
  iniciarFigura();
};

const lanzarConfeti = () => {
  confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
};

const speakText = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-PT";
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
};
</script>

<style scoped>
.juego-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.pizarra {
  width: 100%;
  height: 100%;
  touch-action: none;
  display: block;
  background: white;
  cursor: crosshair;
}

.imagen-figura {
  position: absolute;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  text-align: center;
  pointer-events: none;
}

.imagen-figura img {
  max-width: 180px;
  max-height: 180px;
  animation: aparecer 0.8s ease;
}

.reset-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.reset-button {
  font-size: 1.5rem;
  padding: 1rem 2rem;
  background-color: #32cd32;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
