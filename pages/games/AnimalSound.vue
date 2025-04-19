<template>
    <div class="container py-5 text-center">
      <h2 class="mb-4 text-primary">¿Qué letra es esta?</h2>
  
      <!-- Letra a arrastrar -->
      <div
        class="display-1 fw-bold text-info mb-5 draggable-letter"
        draggable="true"
        @dragstart="onDragStart"
      >
        {{ currentLetter.letter }}
      </div>
  
      <!-- Opciones -->
      <div class="row justify-content-center g-4">
        <div
          class="col-12 col-md-4"
          v-for="(option, index) in currentLetter.options"
          :key="index"
        >
          <div
            class="border rounded-4 p-4 h-100 dropzone"
            :class="{
              'bg-success text-white': result === 'correct' && option === currentLetter.answer,
              'bg-danger text-white': result === 'wrong' && option !== currentLetter.answer
            }"
            @dragover.prevent
            @drop="onDrop(option)"
          >
            <span class="fs-2">{{ option }}</span>
          </div>
        </div>
      </div>
  
      <!-- Feedback -->
      <div v-if="result" class="mt-4 fs-4 fw-semibold" :class="{
        'text-success': result === 'correct',
        'text-danger': result === 'wrong'
      }">
        {{ result === 'correct' ? '¡Muy bien!' : 'Ups, intenta de nuevo' }}
      </div>
  
      <!-- Botón siguiente -->
      <button
        class="btn btn-primary mt-4"
        @click="nextQuestion"
        :disabled="!result"
      >
        Siguiente
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const questions = [
    { letter: 'A', answer: 'A', options: ['A', 'B'] },
    { letter: 'M', answer: 'M', options: ['M', 'N'] },
    { letter: 'E', answer: 'E', options: ['F', 'E'] },
    { letter: 'T', answer: 'T', options: ['L', 'T'] },
  ]
  
  const index = ref(0)
  const result = ref(null)
  const currentLetter = ref(questions[index.value])
  
  const onDragStart = (event) => {
    event.dataTransfer.setData('text/plain', currentLetter.value.letter)
  }
  
  const onDrop = (option) => {
    const dragged = currentLetter.value.letter
    if (option === dragged) {
      result.value = 'correct'
    } else {
      result.value = 'wrong'
    }
  }
  
  const nextQuestion = () => {
    result.value = null
    if (index.value < questions.length - 1) {
      index.value++
      currentLetter.value = questions[index.value]
    } else {
      // Final del juego
      alert('¡Has terminado!')
      index.value = 0
      currentLetter.value = questions[0]
    }
  }
  </script>
  
  <style scoped>
  .draggable-letter {
    cursor: grab;
    user-select: none;
  }
  
  .dropzone {
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px dashed #ccc;
    transition: all 0.3s ease;
  }
  .dropzone:hover {
    border-color: #007bff;
  }
  </style>
  