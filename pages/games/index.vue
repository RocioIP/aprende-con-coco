<template>
  <div class="container py-5 text-center">
    <h2 class="display-5 mb-4 text-primary fw-bold">Escolha um jogo</h2>

    <div class="row justify-content-center g-4">
      <!-- Tarjeta: Colores -->
      <div class="col-6 col-md-4 col-lg-3">
        <NuxtLink to="/games/balloons" class="card juego-card">
          <img src="/images/games/balloons.png" alt="Juego de globos" class="card-img-top" />
        </NuxtLink>
      </div>

      <!-- Tarjeta: Letras -->
      <div class="col-6 col-md-4 col-lg-3">
        <NuxtLink to="/games/letters" class="card juego-card">
          <img src="/images/games/letters.png" alt="Juego de letras" class="card-img-top" />
        </NuxtLink>
      </div>

      <!-- Tarjeta: Números -->
      <div class="col-6 col-md-4 col-lg-3">
        <NuxtLink to="/games/animalsound" class="card juego-card">
          <img src="/images/games/friends.png" alt="Juego de amigos" class="card-img-top" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const text = "Escolha um jogo"
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "pt-PT" // O usa "pt-BR" si prefieres brasileño
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
})
</script>

<style scoped>
.juego-card {
  overflow: hidden;
  border: none;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.juego-card:hover {
  transform: scale(1.03);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.card-img-top {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  border-radius: 15px;
}
</style>
