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

const figuras = [
  "circulo",
  "cuadrado",
  "triangulo",
  "rectangulo",
  "estrella",
  "corazon",
];

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
  const cx = width / 2;
  const cy = height / 2;
  const size = 100;

  const shapes = {
    circulo: Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 2 * Math.PI;
      return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
    }),
    cuadrado: [
      [cx - size, cy - size],
      [cx, cy - size],
      [cx + size, cy - size],
      [cx + size, cy],
      [cx + size, cy + size],
      [cx, cy + size],
      [cx - size, cy + size],
      [cx - size, cy],
    ],
    triangulo: [
      [cx, cy - size],
      [cx + size, cy + size],
      [cx, cy + size / 2],
      [cx - size, cy + size],
    ],
    rectangulo: [
      [cx - size, cy - size / 2],
      [cx, cy - size / 2],
      [cx + size, cy - size / 2],
      [cx + size, cy + size / 2],
      [cx, cy + size / 2],
      [cx - size, cy + size / 2],
    ],
    estrella: [
      [cx, cy - size],
      [cx + 20, cy - 20],
      [cx + size, cy - 20],
      [cx + 30, cy + 10],
      [cx + 60, cy + size],
      [cx, cy + 40],
      [cx - 60, cy + size],
      [cx - 30, cy + 10],
      [cx - size, cy - 20],
      [cx - 20, cy - 20],
    ],
    corazon: [
      [cx, cy + 50],
      [cx + 40, cy + 20],
      [cx + 40, cy - 10],
      [cx + 20, cy - 30],
      [cx, cy - 10],
      [cx - 20, cy - 30],
      [cx - 40, cy - 10],
      [cx - 40, cy + 20],
    ],
  };

  const path = shapes[figuras[figuraActual.value]];
  path.forEach(([x, y]) => puntos.value.push({ x, y }));

  puntos.value.forEach((p) => {
    ctx.value.beginPath();
    ctx.value.arc(p.x, p.y, 10, 0, Math.PI * 2);
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
  puntos.value.forEach((p, index) => {
    if (!puntosVisitados.value.has(index)) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < umbral) {
        puntosVisitados.value.add(index);
        ctx.value.beginPath();
        ctx.value.arc(p.x, p.y, 10, 0, Math.PI * 2);
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

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.font = `${canvas.value.height * 0.15}px Arial`;
  ctx.value.fillStyle = "#32cd32";
  ctx.value.textAlign = "center";
  ctx.value.textBaseline = "middle";
  ctx.value.fillText(
    figuras[figuraActual.value].toUpperCase(),
    canvas.value.width / 2,
    canvas.value.height / 2
  );

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
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.imagen-figura img {
  max-width: 150px;
  max-height: 150px;
  animation: aparecer 1s ease;
}

.reset-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
