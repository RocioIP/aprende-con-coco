<template>
  <div
    class="position-relative overflow-hidden"
    style="height: 100dvh; width: 100vw"
  >
    <h3 v-if="!hasWon" class="text-center mt-3">
      Toca el globo de color <strong>{{ colorNames[targetColor] }}</strong>
    </h3>

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
      <h1 class="display-1 fw-bold text-center">¡Has ganado! 🎉</h1>
      <canvas
        id="confetti-canvas"
        class="position-absolute top-0 start-0 w-100 h-100"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Balloon from "@/components/Balloon.vue";
import confetti from "canvas-confetti";

const balloons = ref([]);
const targetColor = ref("");
const usedColors = ref([]);
const hasWon = ref(false);

const vowels = ["A", "E", "I", "O", "U"];
const colorByVowel = {
  A: "#FF6B6B",
  E: "#FFD93D",
  I: "#4D96FF",
  O: "#6BCB77",
  U: "#FF8000",
};

const colorNames = {
  "#FF6B6B": "rojo",
  "#FFD93D": "amarillo",
  "#4D96FF": "azul",
  "#6BCB77": "verde",
  "#FF8000": "naranja",
};
const margin = 20;
onMounted(() => {
  const screenW = window.innerWidth
  const screenH = window.innerHeight
  const spacing = 120

  vowels.forEach((letter, i) => {
    balloons.value.push({
      letter,
      color: colorByVowel[letter],
      x: screenW / 2 - 250 + i * spacing,
      y: screenH / 2 - 100,
    })
  })

  pickNextTarget()
})


const pickNextTarget = async () => {
  const remaining = balloons.value
    .map((b) => b.color)
    .filter((c) => !usedColors.value.includes(c));
  if (remaining.length > 0) {
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    targetColor.value = next;
  } else {
    hasWon.value = true;
    await nextTick();
    launchConfetti();
  }
};

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

const handleCorrect = (color) => {
  usedColors.value.push(color);
  pickNextTarget();
};

const handleWrong = () => {
  // Puedes poner aquí sonido de error o alguna lógica extra si quieres
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
  padding: 2rem;
}
</style>
