<template>
  <div class="mt-4 d-flex flex-column justify-content-center align-items-center text-center p-4">
    
    <!-- Bocadillo encima de Coco -->
    <div class="mb-3">
      <div class="badge rounded-pill text-dark p-4 fs-4 shadow">
        {{ displayedText }} 🐾
      </div>
    </div>

    <!-- Imagen de Coco (¡ahora también habla!) -->
    <div class="mb-4">
      <img 
        src="/images/global/coco-saludando.webp" 
        alt="Coco saludando" 
        class="img-fluid"
        style="width: 15rem; height: auto; cursor: pointer;" 
        @click="repeatSpeech"
      />
    </div>

    <!-- Botones grandes debajo de Coco -->
    <div class="d-flex gap-5">
      <NuxtLink to="/juegos" @click="stopSpeaking" class="btn btn-warning btn-lg rounded-pill shadow-sm pulse-button">
        🎈 Jogos
      </NuxtLink>
      <NuxtLink to="/cuentos" @click="stopSpeaking" class="btn btn-primary btn-lg rounded-pill shadow-sm pulse-button">
        📖 Histórias
      </NuxtLink>
      <NuxtLink to="/pizarra" @click="stopSpeaking" class="btn btn-danger btn-lg rounded-pill shadow-sm pulse-button">
        🎨 Quadro-negro
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const fullText = "Olá eduardo, eu sou o coco! o que queres fazer hoje?";
const displayedText = ref('');

onMounted(() => {
  typeTextAndSpeak();
});

function typeTextAndSpeak() {
  let index = 0;
  displayedText.value = '';
  const interval = setInterval(() => {
    displayedText.value += fullText[index];
    index++;
    if (index === fullText.length) clearInterval(interval);
  }, 100);

  speakText();
}

function speakText() {
  const utterance = new SpeechSynthesisUtterance(fullText);
  utterance.lang = "pt-PT"; // Cambia a "pt-BR" si prefieres portugués brasileño
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// Repetir la frase al tocar a Coco
function repeatSpeech() {
  speakText();
}

// Detener voz si el niño cambia de sección
function stopSpeaking() {
  speechSynthesis.cancel();
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