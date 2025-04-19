<template>
  <div
    class="position-relative overflow-hidden"
    :key="gameKey"
    style="height: 100dvh; width: 100vw"
  >
    <!-- Frase con color -->
    <h3 v-if="!hasWon" class="text-center mt-3">
      Toca no balão colorido
      <span :style="{ color: targetColor, fontWeight: 'bold' }">
        {{ colorNames[targetColor] }}
      </span>
    </h3>

    <!-- Globos -->
    <Balloon
      v-for="(b, index) in balloons"
      :key="index"
      :x="b.x"
      :y="b.y"
      :color="b.color"
      :letter="b.letter"
      :targetColor="targetColor"
      @correct="handleCorrect(b.color)"
      @wrong="handleWrong"
    />

    <!-- Mensaje de victoria -->
    <div
      v-if="hasWon"
      class="win-message d-flex justify-content-center align-items-center flex-column"
    >
      <h1 class="display-1 fw-bold text-center">¡Boa Eduardo! 🎉</h1>
      <img src="/images/global/coco-aplaudiendo.png" alt="Coco aplaudiendo" class="img-coco-aplaudiendo">
      <canvas
        id="confetti-canvas"
        class="position-absolute top-0 start-0 w-100 h-100"
      ></canvas>
      
     <!--  <button class="btn btn-success mt-4" @click="resetGame">
        🔁 Voltar a jogar
      </button> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Balloon from "@/components/Balloon.vue";
import confetti from "canvas-confetti";

// Refs
const balloons = ref([]);
const targetColor = ref("");
const usedColors = ref([]);
const hasWon = ref(false);
const gameKey = ref(0); // clave para reiniciar el DOM

// Letras y colores
const vowels = ["A", "E", "I", "O", "U"];
const colorByVowel = {
  A: "#FF6B6B",
  E: "#FFD93D",
  I: "#4D96FF",
  O: "#6BCB77",
  U: "#FF8000",
};

const colorNames = {
  "#FF6B6B": "vermelho",
  "#FFD93D": "amarelo",
  "#4D96FF": "azul",
  "#6BCB77": "verde",
  "#FF8000": "laranja",
};

let errorSound
// 🧠 Inicia el juego al cargar
onMounted(() => {
  errorSound = new Audio('/sounds/error.mp3');
  initGame();
});

// 🔁 Reinicia todo el juego
async function resetGame() {
  hasWon.value = false;
  await nextTick();      // asegura que se oculte la pantalla de victoria
  gameKey.value++;       // fuerza el reinicio de toda la vista
  initGame();
}

// 🔄 Lógica para iniciar o reiniciar el juego
function initGame() {
  balloons.value = [];
  hasWon.value = false;
  usedColors.value = [];
  targetColor.value = "";

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const spacing = 120;

  vowels.forEach((letter, i) => {
    balloons.value.push({
      letter,
      color: colorByVowel[letter],
      x: screenW / 2 - 250 + i * spacing,
      y: screenH / 2 - 100,
    });
  });

  pickNextTarget();
}

// 🎯 Selecciona el color objetivo y habla
const pickNextTarget = async () => {
  const remaining = balloons.value
    .map((b) => b.color)
    .filter((c) => !usedColors.value.includes(c));

  if (remaining.length > 0) {
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    targetColor.value = next;

    const colorWord = colorNames[next];
    const sentence = `Toca no balão colorido ${colorWord}`;
    speakText(sentence);
  } else {
    hasWon.value = true;
    await nextTick();
    speakText("Boa Eduardo!");
    launchConfetti();
  }
};

// 🗣️ Texto a voz
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-PT"; // o pt-BR si lo prefieres
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// 🎉 Confetti de victoria
const launchConfetti = () => {
  const canvas = document.getElementById("confetti-canvas");
  if (canvas) {
    const myConfetti = confetti.create(canvas, { resize: true });
    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
    });
  }
};

// ✅ Acertó
const handleCorrect = (color) => {
  usedColors.value.push(color);
  pickNextTarget();
};

// ❌ Falló

const handleWrong = () => {
  errorSound.currentTime = 0;
  errorSound.play();
};
</script>

<style scoped>
.win-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  text-align: center;
  padding: 1rem;
}

button.btn-success {
  font-size: 1.2rem;
  padding: 10px 25px;
  border-radius: 12px;
  font-weight: bold;
}

.img-coco-aplaudiendo {
  width: 25%;
}
</style>
