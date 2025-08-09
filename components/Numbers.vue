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

    <!-- Número grande a la derecha -->
    <div
      v-if="estado === 'completado'"
      class="numero-derecha"
      :style="{ fontSize: rightFontPx + 'px', color: rightColor }"
    >
      {{ numeroActual }}
    </div>

    <!-- Pantalla final -->
    <div v-if="estado === 'finalizado'" class="final-overlay">
      <div class="final-card">
        <h2 class="final-title">Boa Eduardo! 🎉</h2>
        <img src="/images/global/coco-aplaudiendo.png" alt="Coco aplaudindo" class="coco-img" />
        <div class="final-buttons">
          <button class="btn-repetir" @click="reiniciarJuego">🎈 Mais uma!</button>
          <button class="btn-fechar" @click="irAJuegos">✖ Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import confetti from "canvas-confetti";

const router = useRouter();

const canvas = ref(null);
const ctx = ref(null);
const dibujando = ref(false);

const puntos = ref([]);
const puntosVisitados = ref(new Set());
const numeroActual = ref(1);
const umbral = 25;
const estado = ref("puntos");

// tipografía/color del número
const rightFontPx = ref(120);
const rightColor = ref("#32cd32");
const COLORS = ["#FF6B6B", "#FFD93D", "#4D96FF", "#6BCB77", "#FF8000", "#B26CE6", "#00C2CB", "#FF9F1C"];
function pickColor(prev) {
  let c;
  do { c = COLORS[Math.floor(Math.random() * COLORS.length)]; } while (c === prev);
  return c;
}

// helpers para puntos
const SPACING = 28;
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

  const boxH = height * 0.65;
  const cx = width * 0.38;
  const topY = (height - boxH) / 2;

  const rSmall = 48;
  const rMed   = 58;
  const rBig   = 68;

  // === Tus números exactos ===
  const pathsOriginal = {
    1: [
      [cx - 80, topY + 65], [cx - 55, topY + 40], [cx - 30, topY + 20], [cx, topY],
      [cx, topY + 40], [cx, topY + 80], [cx, topY + 120], [cx, topY + 160], [cx, topY + 200], [cx, topY + 240]
    ],
    2: [
      [cx - 60, topY + 20], [cx - 30, topY], [cx, topY], [cx + 30, topY + 20], [cx + 30, topY + 70],
      [cx, topY + 100], [cx - 35, topY + 130], [cx - 60, topY + 160], [cx - 30, topY + 160],
      [cx, topY + 160], [cx + 30, topY + 160]
    ],
    3: (() => {
      const cx3 = cx + 18;
      const r3  = rMed + 10;
      const topArc = sampleArc(cx3, topY + 60,  r3, -Math.PI/1.5,  Math.PI/2);
      const botArc = sampleArc(cx3, topY + 180, r3, -Math.PI/2,  Math.PI/1.5);
      return [...topArc, ...botArc];
    })(),
    4: [
      ...sampleLine(cx - 70, topY + 120, cx + 70, topY + 120),
      ...sampleLine(cx + 70, topY + 10,  cx + 70, topY + 240),
      ...sampleLine(cx + 10, topY + 10,  cx - 70, topY + 120),
    ],
    5: [
      ...sampleLine(cx + 50, topY + 10,  cx - 50, topY + 10),
      ...sampleLine(cx - 50, topY + 10,  cx - 50, topY + 120),
      ...sampleLine(cx - 50, topY + 120, cx + 40,  topY + 120),
      ...sampleArc (cx + 10, topY + 175, rBig, Math.PI, -Math.PI/6),
    ],
    6: [
      ...sampleLine(cx + 50, topY - 30,  cx - 40,        topY + 60),
      ...sampleArc (cx - 10, topY + 140, rBig, -0.3*Math.PI, 1.7*Math.PI),
    ],
    7: [
      ...sampleLine(cx - 70, topY + 10,  cx + 70, topY + 10),
      ...sampleLine(cx + 70, topY + 10,  cx - 10, topY + 240),
    ],
    8: [
      ...sampleArc(cx, topY + 80,  rSmall,     0, Math.PI*2),
      ...sampleArc(cx, topY + 180, rSmall + 10, 0, Math.PI*2),
    ],
    9: [
      ...sampleArc (cx + 10, topY + 80, rMed, 0, Math.PI*2),
      ...sampleLine(cx + 30 + rMed*0.6, topY + 60 + rMed*0.6, cx + 10, topY + 240),
    ],
  };

  puntos.value = pathsOriginal[numeroActual.value].map(([x, y]) => ({ x, y }));
  for (const p of puntos.value) {
    ctx.value.beginPath();
    ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.value.fillStyle = "rgba(0,0,0,0.15)";
    ctx.value.fill();
  }

  rightFontPx.value = Math.max(64, Math.floor(boxH * 0.8));

  speakText(`Pinta o número ${numeroActual.value}`);
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
  rightColor.value = pickColor(rightColor.value);

  estado.value = "completado";
  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

  await nextTick();

  if (numeroActual.value < 9) {
    setTimeout(() => { numeroActual.value++; iniciarNumero(); }, 1100);
  } else {
    setTimeout(() => {
      speakText("Boa Eduardo!");
      estado.value = "finalizado";
      confetti({ particleCount: 180, spread: 100, startVelocity: 45, origin: { y: 0.6 } });
    }, 1100);
  }
}

function reiniciarJuego() {
  estado.value = "puntos";
  numeroActual.value = 1;
  iniciarNumero();
}
function irAJuegos() {
  router.push("/blackboard");
}

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
.pizarra { width: 100%; height: 100%; touch-action: none; background: white; display: block; }
.numero-derecha {
  position: absolute; top: 50%; right: 8%; transform: translateY(-50%);
  font-weight: 800; line-height: 1; text-shadow: 0 2px 6px rgba(0,0,0,.15);
  pointer-events: none;
}
.final-overlay {
  position: fixed; inset: 0; background: rgba(255,255,255,0.85);
  display: grid; place-items: center; z-index: 999;
}
.final-card {
  background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2); max-width: 420px; width: calc(100% - 2rem);
}
.final-title { margin: 0 0 .75rem; font-size: 1.8rem; }
.coco-img { width: min(40vw, 220px); max-width: 220px; margin: .5rem auto 1rem; display: block; }
.final-buttons { display: flex; gap: .6rem; justify-content: center; }
.btn-repetir, .btn-fechar {
  border: none; border-radius: 30px; padding: 0.65rem 1.4rem; font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,.15); transition: transform .15s ease, background-color .15s ease;
  cursor: pointer;
}
.btn-repetir { background: #108818; color: #fff; }
.btn-repetir:hover { background: #198e09; transform: translateY(-1px); }
.btn-fechar { background: #e9ecef; color: #333; }
.btn-fechar:hover { background: #dee2e6; transform: translateY(-1px); }
</style>
