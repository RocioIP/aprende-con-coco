<template>
  <div class="mt-4 d-flex flex-column justify-content-center align-items-center text-center p-4">
    
    <!-- Bocadillo encima de Coco -->
    <div class="mb-3">
      <div class="badge rounded-pill text-dark p-4 fs-4 shadow">
        {{ displayedText }} 🐾
      </div>
    </div>

    <!-- Imagen de Coco -->
    <div class="mb-4">
      <img src="/imagenes/coco-saludando.webp" alt="Coco saludando" class="img-fluid" style="width: 15rem; height: auto;" />
    </div>

    <!-- Botones grandes debajo de Coco -->
    <div class="d-flex gap-5">
      <NuxtLink to="/juegos" @click="playAudio" class="btn btn-warning btn-lg rounded-pill shadow-sm pulse-button">
        🎮 Juegos
      </NuxtLink>
      <NuxtLink to="/cuentos" class="btn btn-primary btn-lg rounded-pill shadow-sm pulse-button">
        📖 Cuentos
      </NuxtLink>
      <NuxtLink to="/pizarra" class="btn btn-danger btn-lg rounded-pill shadow-sm pulse-button">
        🎨 Pizarra
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const fullText = "Hola Eduardo, qué quieres hacer hoy?";
const displayedText = ref('');
let audio;

onMounted(() => {
  audio = new Audio('/imagenes/saludo-coco.mp3'); // Asegúrate que esté fuera de /public en la carpeta correcta
  typeText();
});

function typeText() {
  let index = 0;
  const interval = setInterval(() => {
    displayedText.value += fullText[index];
    index++;
    if (index === fullText.length) clearInterval(interval);
  }, 100);
}

function playAudio() {
  audio.play();
}
</script>

<style scoped>
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.75; }
  100% { transform: scale(1); opacity: 1; }
}

.pulse-button {
  animation: pulse 1.5s infinite;
  padding: 10px 25px;
  font-size: 1.5rem;
}
</style>
