<template>
  <div class="container py-5 text-center position-relative overflow-hidden" style="min-height: 100vh;">
    <h2 class="mb-4 text-primary display-5" v-if="!hasWon">Que animal faz este som?</h2>

    <!-- Botón para repetir el sonido -->
    <button v-if="!hasWon" class="btn btn-info mb-4" @click="playSound">
      🔊 Escuchar sonido
    </button>

    <!-- Opciones de animales -->
    <div v-if="!hasWon" class="row justify-content-center g-4">
      <div
        class="col-6 col-md-3"
        v-for="(animal, index) in currentQuestion.options"
        :key="index"
      >
        <div
          class="animal-card p-3 border rounded shadow-sm h-100"
          :class="{
            'bg-success text-white': result === 'correct' && animal.name === currentQuestion.answer,
            'bg-danger text-white': result === 'wrong' && animal.name !== currentQuestion.answer
          }"
          @click="checkAnswer(animal.name)"
        >
          <img :src="animal.image" :alt="animal.name" class="img-fluid rounded mb-2" />
          <div class="fs-4">{{ animal.name }}</div>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="result && !hasWon" class="mt-4 fs-3 fw-bold" :class="{
      'text-success': result === 'correct',
      'text-danger': result === 'wrong'
    }">
      {{ result === 'correct' ? '🎉 ¡Muy bien!' : '😬 Intenta otra vez' }}
    </div>

    <!-- Botón siguiente -->
    <button
      v-if="!hasWon"
      class="btn btn-primary mt-4 px-5 py-2"
      @click="nextQuestion"
      :disabled="!result"
    >
      👉 Siguiente
    </button>

    <!-- Pantalla de victoria -->
    <div
      v-if="hasWon"
      class="win-message d-flex justify-content-center align-items-center flex-column"
    >
      <h1 class="display-1 fw-bold text-center">¡Boa Eduardo! 🎉</h1>
      <img src="/images/global/coco-aplaudiendo.png" alt="Coco aplaudiendo" class="img-coco-aplaudiendo">
      <canvas id="confetti-canvas" class="position-absolute top-0 start-0 w-100 h-100"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import confetti from 'canvas-confetti'

const questions = [
  {
    sound: '/sounds/animals/lion.mp3',
    answer: 'León',
    options: [
      { name: 'León', image: '/images/games/animals/lion.png' },
      { name: 'Gato', image: '/images/games/animals/cat.png' }
    ]
  },
  {
    sound: '/sounds/animals/dog.mp3',
    answer: 'Perro',
    options: [
      { name: 'Perro', image: '/images/games/animals/dog.png' },
      { name: 'Gallo', image: '/images/games/animals/rooster.png' }
    ]
  },
  {
    sound: '/sounds/animals/cat.mp3',
    answer: 'Gato',
    options: [
      { name: 'Pato', image: '/images/games/animals/duck.png' },
      { name: 'Gato', image: '/images/games/animals/cat.png' }
    ]
  },
  {
    sound: '/sounds/animals/duck.mp3',
    answer: 'Pato',
    options: [
      { name: 'Pato', image: '/images/games/animals/duck.png' },
      { name: 'León', image: '/images/games/animals/lion.png' }
    ]
  },
  {
    sound: '/sounds/animals/rooster.mp3',
    answer: 'Gallo',
    options: [
      { name: 'Perro', image: '/images/games/animals/dog.png' },
      { name: 'Gallo', image: '/images/games/animals/rooster.png' }
    ]
  }
]

const index = ref(0)
const result = ref(null)
const hasWon = ref(false)
const currentQuestion = ref(questions[index.value])
let audio = null

onMounted(() => {
  playSound()
})

const playSound = () => {
  if (typeof window !== 'undefined') {
    if (audio) audio.pause()
    audio = new Audio(currentQuestion.value.sound)
    audio.play()
  }
}

const checkAnswer = (selected) => {
  if (selected === currentQuestion.value.answer) {
    result.value = 'correct'
  } else {
    result.value = 'wrong'
  }
}

const nextQuestion = async () => {
  result.value = null
  if (index.value < questions.length - 1) {
    index.value++
    currentQuestion.value = questions[index.value]
    playSound()
  } else {
    hasWon.value = true
    await nextTick()
    speakText('Boa Eduardo!')
    launchConfetti()
  }
}

const speakText = (text) => {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

const launchConfetti = () => {
  const canvas = document.getElementById('confetti-canvas')
  if (canvas) {
    const myConfetti = confetti.create(canvas, { resize: true })
    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    })
  }
}
</script>

<style scoped>
.animal-card {
  transition: transform 0.2s ease;
  cursor: pointer;
}
.animal-card:hover {
  transform: scale(1.05);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
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
.img-coco-aplaudiendo {
  width: 25%;
}
</style>
