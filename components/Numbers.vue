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

    <!-- Número completo a la derecha cuando se completa -->
    <div
      v-if="estado === 'completado'"
      class="numero-derecha"
      :style="{ fontSize: rightFontPx + 'px', color: rightColor }"
    >
      {{ numeroActual }}
    </div>

    <div v-if="estado === 'finalizado'" class="reset-overlay">
      <button class="reset-button" @click="reiniciarJuego">Volver a empezar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import confetti from "canvas-confetti";

const emit = defineEmits(["finalizado"]);

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);

const puntos = ref([]);
const puntosVisitados = ref(new Set());
const numeroActual = ref(1);
const umbral = 25;
const estado = ref("puntos");

// caja visual y tipografía del número de la derecha
let boxX = 0, boxY = 0, boxW = 0, boxH = 0;
const rightFontPx = ref(120);
const rightColor  = ref("#32cd32");
const COLORS = ['#FF6B6B','#FFD93D','#4D96FF','#6BCB77','#FF8000','#B26CE6','#00C2CB','#FF9F1C'];
function pickColor(prev) {
  let c; do { c = COLORS[Math.floor(Math.random()*COLORS.length)] } while (c === prev);
  return c;
}

/* === Helpers: muestreo con separación como en 1–2 === */
const SPACING = 28;   // separación entre puntos (misma “sensación” que 1–2)
const DOT_RADIUS = 10;

function sampleLine(x1, y1, x2, y2, spacing = SPACING) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const n = Math.max(1, Math.floor(L / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x1 + dx * t, y1 + dy * t]);
  }
  return out;
}
function sampleArc(cx, cy, r, start, end, spacing = SPACING) {
  const L = Math.abs(end - start) * r;
  const n = Math.max(1, Math.floor(L / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = start + ((end - start) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
function pointOnArc(cx, cy, r, ang) {
  return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
}

onMounted(() => {
  const c = canvas.value;
  c.width = c.offsetWidth;
  c.height = c.offsetHeight;
  ctx.value = c.getContext("2d");
  iniciarNumero();
});

function iniciarNumero() {
  estado.value = "puntos";
  puntos.value = [];
  puntosVisitados.value = new Set();
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const width = canvas.value.width;
  const height = canvas.value.height;

  // caja visual global (referencia de tamaño)
  boxH = height * 0.65;
  boxW = boxH * 0.6;
  boxX = (width - boxW) / 2;
  boxY = (height - boxH) / 2;

  // PUNTOS A LA IZQUIERDA (centrado vertical)
  const cx = width * 0.38;
  const topY = (height - boxH) / 2; // similar a tu 1–2
  const midY = topY + boxH / 2;

  // radios de referencia para curvas 3–9
  const rSmall = 48;
  const rMed   = 58;
  const rBig   = 68;

  // TODOS los números definidos dentro del objeto (sin switch)
  const pathsOriginal = {
    // 1 y 2 EXACTAMENTE como los tuyos
    1: [
      [cx - 80, topY + 65], [cx - 55, topY + 40], [cx - 30, topY + 20], [cx, topY],
      [cx, topY + 40], [cx, topY + 80], [cx, topY + 120], [cx, topY + 160], [cx, topY + 200], [cx, topY + 240]
    ],
    2: [
      [cx - 60, topY + 20], [cx - 30, topY], [cx, topY], [cx + 30, topY + 20], [cx + 30, topY + 70],
      [cx, topY + 100], [cx - 35, topY + 130], [cx - 60, topY + 160], [cx - 30, topY + 160],
      [cx, topY + 160], [cx + 30, topY + 160]
    ],

    // 3 mejorado: barrigas un poco más grandes y con 2 puntos extra “delante”
    3: (() => {
      const cx3 = cx + 18;     // desplaza un pelín a la derecha
      const r3  = rMed + 10;   // barriga más marcada
      const extra = [-0.16, 0.16]; // dos puntos alrededor de 0 rad (delante)
      const topArc    = sampleArc(cx3, topY + 60,  r3, -Math.PI/2,  Math.PI/2);
      const topExtras = extra.map(a => pointOnArc(cx3, topY + 60,  r3, a));
      const botArc    = sampleArc(cx3, topY + 180, r3, -Math.PI/2,  Math.PI/2);
      const botExtras = extra.map(a => pointOnArc(cx3, topY + 180, r3, a));
      return [...topArc, ...topExtras, ...botArc, ...botExtras];
    })(),

    // 4: barra, columna y diagonal
    4: [
      ...sampleLine(cx - 70, topY + 120, cx + 70, topY + 120),
      ...sampleLine(cx + 70, topY + 10,  cx + 70, topY + 240),
      ...sampleLine(cx + 30, topY + 10,  cx - 70, topY + 120),
    ],

    // 5: techo, columna, barra media y panza inferior
    5: [
      ...sampleLine(cx + 70, topY + 10,  cx - 70, topY + 10),
      ...sampleLine(cx - 70, topY + 10,  cx - 70, topY + 120),
      ...sampleLine(cx - 70, topY + 120, cx + 40,  topY + 120),
      ...sampleArc (cx + 10, topY + 175, rBig, Math.PI, -Math.PI/6),
    ],

    // 6: pequeña entrada + gran lazo inferior
    6: [
      ...sampleLine(cx + 60, topY + 40,  cx,        topY + 60),
      ...sampleArc (cx - 10, topY + 160, rBig, -0.3*Math.PI, 1.7*Math.PI),
    ],

    // 7: techo + diagonal
    7: [
      ...sampleLine(cx - 70, topY + 10,  cx + 70, topY + 10),
      ...sampleLine(cx + 70, topY + 10,  cx - 10, topY + 240),
    ],

    // 8: doble aro
    8: [
      ...sampleArc(cx, topY + 80,  rSmall,     0, Math.PI*2),
      ...sampleArc(cx, topY + 180, rSmall + 10, 0, Math.PI*2),
    ],

    // 9: aro superior + cola
    9: [
      ...sampleArc (cx + 10, topY + 80, rMed, 0, Math.PI*2),
      ...sampleLine(cx + 10 + rMed*0.6, topY + 80 + rMed*0.6, cx + 70, topY + 240),
    ],
  };

  // Puntos guía para el número actual (izquierda)
  puntos.value = pathsOriginal[numeroActual.value].map(([x, y]) => ({ x, y }));

  for (const p of puntos.value) {
    ctx.value.beginPath();
    ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.value.fillStyle = "rgba(0,0,0,0.15)";
    ctx.value.fill();
  }

  // tamaño del número de la derecha equivalente a la caja
  rightFontPx.value = Math.max(64, Math.floor(boxH * 0.8));

  const nomes = ["un", "dous", "três", "catro", "cinco", "seis", "sete", "oito", "nove"];
  speakText(`Pinta o número ${nomes[numeroActual.value - 1]}`);
}

function getCoords(e) {
  const r = canvas.value.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return { x, y };
}
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
const stopDraw = () => { dibujando.value = false; };

function verificarPunto(x, y) {
  if (estado.value !== "puntos") return;

  puntos.value.forEach((p, idx) => {
    if (!puntosVisitados.value.has(idx)) {
      if (Math.hypot(p.x - x, p.y - y) < umbral) {
        puntosVisitados.value.add(idx);
        ctx.value.beginPath();
        ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.value.fillStyle = "#32cd32";
        ctx.value.fill();
      }
    }
  });

  if (puntosVisitados.value.size === puntos.value.length) {
    completarNumero();
  }
}

async function completarNumero() {
  // color nuevo para el número de la derecha
  rightColor.value = pickColor(rightColor.value);

  estado.value = "completado";
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });

  // dejamos los puntos visibles a la izquierda
  await nextTick();

  if (numeroActual.value < 9) {
    setTimeout(() => { numeroActual.value++; iniciarNumero(); }, 1500);
  } else {
    setTimeout(() => { speakText("Boa Eduardo!"); estado.value = "finalizado"; emit("finalizado"); }, 1500);
  }
}

function reiniciarJuego() { numeroActual.value = 1; iniciarNumero(); }

function speakText(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-PT";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}
</script>

<style scoped>
.juego-container { position: relative; width: 100%; height: 100%; }
.pizarra {
  width: 100%; height: 100%; touch-action: none; display: block;
  background: white; cursor: crosshair;
}

/* Número completo a la derecha, centrado verticalmente */
.numero-derecha {
  position: absolute;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  line-height: 1;
  font-weight: 800;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  text-shadow: 0 2px 6px rgba(0,0,0,.15);
  pointer-events: none;
}

.reset-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.8);
  display: flex; justify-content: center; align-items: center; z-index: 10;
}
.reset-button {
  font-size: 1.5rem; padding: 1rem 2rem; background-color: #32cd32; border: none;
  border-radius: 8px; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
</style>
