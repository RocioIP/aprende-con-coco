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

/* === Ajuste clave: separación uniforme entre puntos === */
const DOT_SPACING = 28; // ≈ distancia entre puntos (ajusta a tu gusto)
const DOT_RADIUS  = 10;

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

  // Caja “bonita” para 3–9
  const boxH = height * 0.65;
  const boxW = boxH * 0.6;
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;

  // Mantén TUS 1 y 2 tal cual:
  const cx = width / 1.95;
  const topY = height * 0.2;
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
  };

  if (numeroActual.value === 1 || numeroActual.value === 2) {
    puntos.value = pathsOriginal[numeroActual.value].map(([x, y]) => ({ x, y }));
  } else {
    puntos.value = buildNumberPointsImproved(numeroActual.value, boxX, boxY, boxW, boxH);
  }

  // Dibuja guías
  for (const p of puntos.value) {
    ctx.value.beginPath();
    ctx.value.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.value.fillStyle = "rgba(0,0,0,0.15)";
    ctx.value.fill();
  }

  const nomes = ["un", "dous", "três", "catro", "cinco", "seis", "sete", "oito", "nove"];
  speakText(`Pinta o número ${nomes[numeroActual.value - 1]}`);
}

/* ===== Helpers con ESPACIADO UNIFORME ===== */
function sampleLineSpaced(x1, y1, x2, y2, spacing = DOT_SPACING) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L === 0) return [{ x: x1, y: y1 }];
  const n = Math.max(1, Math.floor(L / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: x1 + dx * t, y: y1 + dy * t });
  }
  return out;
}

function sampleArcSpaced(cx, cy, r, start, end, spacing = DOT_SPACING) {
  let delta = end - start;
  // normaliza a -PI..PI para hallar longitud correcta
  if (delta > Math.PI * 2) delta = Math.PI * 2;
  if (delta < -Math.PI * 2) delta = -Math.PI * 2;
  const L = Math.abs(delta) * r;
  const n = Math.max(1, Math.floor(L / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + delta * t;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
}

// Semicírculo derecho “seguro” (arriba→abajo) sin pelearse con ángulos
function rightSemi(cx, cy, r, spacing = DOT_SPACING) {
  // recorre Y y calcula X>cx
  const L = Math.PI * r; // semicírculo
  const n = Math.max(1, Math.floor(L / spacing));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; // 0..1 top->bottom
    const y = cy + (t * 2 - 1) * r;
    const x = cx + Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    out.push({ x, y });
  }
  return out;
}

/* ===== Números mejorados 3–9 con puntos espaciados ===== */
function buildNumberPointsImproved(n, x, y, w, h) {
  const pts = [];
  const left = x, right = x + w, top = y, bottom = y + h;
  const midX = x + w / 2, midY = y + h / 2;
  const pad = Math.min(w, h) * 0.08;

  switch (n) {
    case 3: {
      const r = Math.min(w, h) * 0.28;
      const cxTop = midX - w * 0.04;
      const cyTop = top + h * 0.30;
      const cxBot = midX - w * 0.04;
      const cyBot = top + h * 0.72;
      pts.push(...rightSemi(cxTop, cyTop, r));
      pts.push(...rightSemi(cxBot, cyBot, r));
      break;
    }
    case 4: {
      const xRight = right - pad * 1.1;
      const yCross = top + h * 0.48;
      // barra horizontal cruce
      pts.push(...sampleLineSpaced(left + pad, yCross, xRight, yCross));
      // columna derecha
      pts.push(...sampleLineSpaced(xRight, top + pad, xRight, bottom - pad));
      // pequeña diagonal de apoyo (opc.)
      pts.push(...sampleLineSpaced(left + pad, yCross, left + pad + w * 0.35, yCross));
      break;
    }
    case 5: {
      // techo
      pts.push(...sampleLineSpaced(right - pad, top + pad, left + pad, top + pad));
      // columna izquierda hasta mitad
      pts.push(...sampleLineSpaced(left + pad, top + pad, left + pad, midY));
      // barra media
      pts.push(...sampleLineSpaced(left + pad, midY, midX + w * 0.25, midY));
      // curva inferior a la derecha
      const r = Math.min(w, h) * 0.30;
      const cx = midX + w * 0.05;
      const cy = top + h * 0.72;
      // arco ~180°→-30° (abre a la derecha)
      pts.push(...sampleArcSpaced(cx, cy, r, Math.PI, -Math.PI / 6));
      break;
    }
    case 6: {
      // pequeña entrada
      pts.push(...sampleLineSpaced(right - pad * 1.3, top + h * 0.22, midX, top + h * 0.28));
      // bucle inferior (casi círculo)
      const r = Math.min(w, h) * 0.30;
      const cx = midX - w * 0.06;
      const cy = top + h * 0.68;
      pts.push(...sampleArcSpaced(cx, cy, r, -0.35 * Math.PI, 1.65 * Math.PI)); // 2π-0.35π
      break;
    }
    case 7: {
      // techo
      pts.push(...sampleLineSpaced(left + pad, top + pad, right - pad, top + pad));
      // diagonal hacia abajo izquierda
      pts.push(...sampleLineSpaced(right - pad, top + pad, midX, bottom - pad));
      break;
    }
    case 8: {
      // dos aros
      const r1 = Math.min(w, h) * 0.22;
      const r2 = Math.min(w, h) * 0.26;
      const cxTop = midX, cyTop = top + h * 0.30;
      const cxBot = midX, cyBot = top + h * 0.72;
      pts.push(...sampleArcSpaced(cxTop, cyTop, r1, 0, Math.PI * 2));
      pts.push(...sampleArcSpaced(cxBot, cyBot, r2, 0, Math.PI * 2));
      break;
    }
    case 9: {
      // aro superior + cola
      const r = Math.min(w, h) * 0.26;
      const cx = midX + w * 0.02;
      const cy = top + h * 0.34;
      pts.push(...sampleArcSpaced(cx, cy, r, 0, Math.PI * 2));
      pts.push(...sampleLineSpaced(cx + r * 0.6, cy + r * 0.6, right - pad * 1.3, bottom - pad));
      break;
    }
    default:
      // fallback
      pts.push(...sampleLineSpaced(midX, top + pad, midX, bottom - pad));
  }
  return dedupeClosePoints(pts, DOT_SPACING * 0.45); // quita puntos muy pegados
}

// elimina puntos demasiado cercanos (por seguridad, p.ej. en uniones)
function dedupeClosePoints(arr, minDist) {
  if (!arr.length) return arr;
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    const a = arr[i], b = out[out.length - 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) >= minDist) out.push(a);
  }
  return out;
}

/* ====== interacción ====== */
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
  estado.value = "completado";
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });

  await nextTick();
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  const fontSize = canvas.value.height * 0.65;
  ctx.value.font = `${fontSize}px Arial`;
  ctx.value.fillStyle = "#32cd32";
  ctx.value.textAlign = "center";
  ctx.value.textBaseline = "middle";
  ctx.value.fillText(numeroActual.value.toString(), canvas.value.width / 2, canvas.value.height / 2);

  if (numeroActual.value < 9) {
    setTimeout(() => { numeroActual.value++; iniciarNumero(); }, 1500);
  } else {
    setTimeout(() => { speakText("Boa Eduardo!"); estado.value = "finalizado"; emit("finalizado"); }, 1500);
  }
}

function reiniciarJuego() { numeroActual.value = 1; iniciarNumero(); }

function speakText(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-PT";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
</script>

<style scoped>
.juego-container { position: relative; width: 100%; height: 100%; }
.pizarra {
  width: 100%; height: 100%; touch-action: none; display: block;
  background: white; cursor: crosshair;
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
