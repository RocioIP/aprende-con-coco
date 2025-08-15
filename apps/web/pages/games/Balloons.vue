<template>
  <div class="game-container" ref="containerEl">
    <div class="topbar">
      <div class="levels">
        <button
          class="lvl-btn"
          :class="{ active: level === 1 }"
          @click="switchLevel(1)"
        >
          Nível 1
        </button>
        <button
          class="lvl-btn"
          :class="{ active: level === 2 }"
          @click="switchLevel(2)"
        >
          Nível 2
        </button>
      </div>
    </div>

    <h3 v-if="!hasWon" class="display-6 fw-bold text-center mt-3">
      Toca no balão
      <span
        v-if="targetColor"
        :style="{ color: targetColor, fontWeight: 'bold' }"
      >
        {{ targetColorName }}
      </span>
      <span v-if="level === 2 && targetSize" class="badge-size">
        {{ targetSize }}
      </span>
    </h3>

    <div ref="boardEl" class="balloons-board position-relative mx-auto">
      <Balloon
        v-for="b in balloons"
        :key="b.id"
        :x="b.x"
        :y="b.y"
        :color="b.color"
        :letter="b.letter"
        :size="b.size"
        :targetColor="targetColor"
        :targetSize="level === 2 ? targetSize : null"
        @correct="({ x, y, color, size }) => handleCorrect(color, size, x, y)"
        @wrong="handleWrong"
      />
    </div>

    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h1 class="display-6 fw-bold text-center mb-3">🎉 Parabéns!</h1>
        <img
          src="/images/global/coco-aplaudiendo.webp"
          alt="Coco aplaudindo"
          class="img-coco-aplaudiendo"
        />
        <div class="d-flex gap-2 justify-content-center mt-4">
          <button class="btn-mais-uma" @click="resetGame">🎈 Mais uma!</button>
          <button class="btn-salir" @click="goToGames">✖ Fechar</button>
        </div>
      </div>
      <canvas id="confetti-canvas" class="confetti-canvas" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from "vue";
import { useRouter } from "vue-router";
import Balloon from "@/components/Balloon.vue";
import confetti from "canvas-confetti";

const router = useRouter();

/* ====== CONFIG ====== */
const vowels = ["A", "E", "I", "O", "U"];
const colorByVowel = {
  A: "#FF6B6B", // vermelho
  E: "#FFD93D", // amarelo
  I: "#4D96FF", // azul
  O: "#6BCB77", // verde  (¡ojo al hex correcto!)
  U: "#FF8000", // laranja
};
const colorNames = {
  "#FF6B6B": "vermelho",
  "#FFD93D": "amarelo",
  "#4D96FF": "azul",
  "#6BCB77": "verde",
  "#FF8000": "laranja",
};

const LEVEL2_SIZES = ["grande", "pequeno"];

/* ====== STATE ====== */
const level = ref(1); // 1 o 2
const balloons = ref([]);
const targetColor = ref("");
const targetColorName = ref(""); // 👈 nombre del color mostrado y hablado
const targetSize = ref(null); // 'grande' | 'pequeno' (solo nivel 2)
const usedColors = ref([]); // nivel 1
const removedColors = ref([]); // nivel 2 (pares removidos)
const hasWon = ref(false);

const containerEl = ref(null);
const boardEl = ref(null);

let errorSound;

/* ====== MOUNT ====== */
onMounted(() => {
  errorSound = new Audio("/sounds/error.mp3");
  initGame();
});

watch(level, () => {
  // al cambiar de nivel reiniciamos
  resetGame();
});

/* ====== INIT & ROUND ====== */
function initGame() {
  balloons.value = [];
  hasWon.value = false;
  usedColors.value = [];
  removedColors.value = [];
  targetColor.value = "";
  targetColorName.value = "";
  targetSize.value = null;

  placeBalloons();
  requestAnimationFrame(() => {
    containerEl.value?.scrollTo({ top: 0, behavior: "instant" });
  });
  pickNextTarget();
}

function placeBalloons() {
  const margin = 12;
  const boardRect = boardEl.value?.getBoundingClientRect();
  const boardW = boardRect?.width || Math.min(window.innerWidth, 900);
  const boardH = 900;

  const CLUSTER_PADDING_TOP = 80;
  const CLUSTER_HEIGHT = 520;
  const CLUSTER_WIDTH_RATIO = 0.85;

  const clusterW = boardW * CLUSTER_WIDTH_RATIO;
  const clusterH = Math.min(CLUSTER_HEIGHT, boardH - CLUSTER_PADDING_TOP - 40);
  const clusterX0 = (boardW - clusterW) / 2;
  const clusterY0 = CLUSTER_PADDING_TOP;

  const positions = [];
  const isOverlapping = (x, y, w, h) =>
    positions.some(
      (pos) =>
        Math.abs(pos.x - x) < (pos.w + w) / 2 + margin &&
        Math.abs(pos.y - y) < (pos.h + h) / 2 + margin
    );

  const dims = (size) =>
    size === "pequeno" ? { w: 75, h: 90 } : { w: 100, h: 120 };

  if (level.value === 1) {
    vowels.forEach((letter, idx) => {
      const size = "grande";
      const { w, h } = dims(size);
      let x,
        y,
        tries = 0;
      do {
        x = Math.random() * (clusterW - w) + clusterX0;
        y = Math.random() * (clusterH - h) + clusterY0;
        tries++;
      } while (isOverlapping(x, y, w, h) && tries < 200);
      positions.push({ x, y, w, h });
      balloons.value.push({
        id: `L1-${idx}`,
        letter,
        color: colorByVowel[letter],
        x,
        y,
        size,
      });
    });
  } else {
    // 10 globos: 5 cores × {grande, pequeno}
    let idc = 0;
    vowels.forEach((letter) => {
      LEVEL2_SIZES.forEach((size) => {
        const { w, h } = dims(size);
        let x,
          y,
          tries = 0;
        do {
          x = Math.random() * (clusterW - w) + clusterX0;
          y = Math.random() * (clusterH - h) + clusterY0;
          tries++;
        } while (isOverlapping(x, y, w, h) && tries < 300);
        positions.push({ x, y, w, h });
        balloons.value.push({
          id: `L2-${idc++}`,
          letter,
          color: colorByVowel[letter],
          x,
          y,
          size,
        });
      });
    });
  }
}

/* ====== OBJETIVO ====== */
const pickNextTarget = async () => {
  if (level.value === 1) {
    const remainingColors = balloons.value
      .map((b) => b.color)
      .filter((c) => !usedColors.value.includes(c));
    if (remainingColors.length > 0) {
      const next =
        remainingColors[Math.floor(Math.random() * remainingColors.length)];
      targetColor.value = next;
      targetColorName.value = colorNames[next] || "";
      targetSize.value = null;
      speakText(`Toca no balão colorido ${targetColorName.value}`);
    } else {
      await win();
    }
  } else {
    // Nivel 2: elegir (color, tamaño) entre los aún presentes (y no eliminados por par)
    const remaining = balloons.value.filter(
      (b) => !removedColors.value.includes(b.color)
    );
    if (remaining.length === 0) {
      await win();
      return;
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)]
targetColor.value = pick.color
targetColorName.value = colorNames[pick.color] || ''
targetSize.value = pick.size
speakText(`Toca no balão ${targetColorName.value} ${targetSize.value}`)
  }
};

async function win() {
  hasWon.value = true;
  await nextTick();
  launchConfetti();
  speakText("Parabéns!");
}

/* ====== HANDLERS ====== */
function switchLevel(lvl) {
  if (level.value === lvl) return;
  level.value = lvl;
}

const handleCorrect = (color, size, centerX, centerY) => {
  popConfettiAt(centerX, centerY);

  if (level.value === 1) {
    balloons.value = balloons.value.filter((b) => b.color !== color);
    usedColors.value.push(color);
  } else {
    // Nivel 2: eliminar los DOS globos del mismo color
    balloons.value = balloons.value.filter((b) => b.color !== color);
    if (!removedColors.value.includes(color)) removedColors.value.push(color);
  }

  pickNextTarget();
};

const handleWrong = () => {
  errorSound.currentTime = 0;
  errorSound.play();
};

/* ====== VOZ ====== */
function speakText(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-PT";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ====== CONFETTI ====== */
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (canvas) {
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
    myConfetti({
      particleCount: 220,
      spread: 100,
      startVelocity: 45,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 },
    });
  } else {
    confetti({
      particleCount: 220,
      spread: 100,
      startVelocity: 45,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 },
    });
  }
}

function popConfettiAt(centerX, centerY) {
  const rect = boardEl.value?.getBoundingClientRect();
  if (!rect) return;
  const clientX = rect.left + centerX;
  const clientY = rect.top + centerY;
  const originX = clientX / window.innerWidth;
  const originY = clientY / window.innerHeight;

  confetti({
    particleCount: 70,
    spread: 60,
    startVelocity: 35,
    gravity: 0.9,
    ticks: 120,
    origin: { x: originX, y: originY },
  });
}

/* ====== RESET / NAV ====== */
async function resetGame(speak = true) {
  hasWon.value = false;
  usedColors.value = [];
  removedColors.value = [];
  targetColor.value = "";
  targetColorName.value = "";
  targetSize.value = null;
  balloons.value = [];
  await nextTick();
  placeBalloons();
  if (speak) pickNextTarget();
}

function goToGames() {
  router.push("/games");
}
</script>

<style scoped>
.game-container {
  width: 100vw;
  min-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 2rem;
}
.topbar {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}
.levels {
  display: flex;
  gap: 0.5rem;
}
.lvl-btn {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-weight: 700;
  background: #e9ecef;
  cursor: pointer;
}
.lvl-btn.active {
  background: #0d6efd;
  color: #fff;
}

.badge-size {
  margin-left: 0.5rem;
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #f1f3f5;
  font-weight: 800;
  text-transform: capitalize;
}

.balloons-board {
  width: min(100%, 900px);
  min-height: 900px;
  margin: 1rem auto 2rem;
  position: relative;
}

.win-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.35);
  z-index: 1040;
  pointer-events: none;
}
.win-card {
  pointer-events: auto;
  background: #fff;
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 420px;
  width: calc(100% - 2rem);
}
.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
}

.img-coco-aplaudiendo {
  width: min(40vw, 220px);
  max-width: 220px;
}

.btn-mais-uma,
.btn-salir {
  border: none;
  border-radius: 30px;
  padding: 0.65rem 1.4rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, background-color 0.15s ease;
  cursor: pointer;
}
.btn-mais-uma {
  background-color: #108818;
  color: #fff;
}
.btn-mais-uma:hover {
  background-color: #198e09;
  transform: translateY(-1px);
}
.btn-salir {
  background: #e9ecef;
  color: #333;
}
.btn-salir:hover {
  background: #dee2e6;
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .img-coco-aplaudiendo {
    width: 45vw;
  }
  .btn-mais-uma,
  .btn-salir {
    padding: 0.55rem 1.1rem;
  }
}
</style>
