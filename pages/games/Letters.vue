<template>
  <div class="container py-5 text-center">
    <h2 class="mb-4 text-primary display-5">
      Com qual é que se assemelha?
    </h2>

    <!-- Letra a arrastrar -->
    <div
      class="draggable-letter mb-5 mx-auto"
      draggable="true"
      @dragstart="onDragStart"
      @touchstart.prevent="onTouchStart"
      @touchend="onTouchEnd"
    >
      {{ currentLetter.letter }}
    </div>

    <!-- Opciones -->
    <div class="row justify-content-center g-4">
      <div
        class="col-6 col-md-3"
        v-for="(option, index) in currentLetter.options"
        :key="index"
      >
        <div
          class="dropzone fs-1"
          :class="{
            'bg-success text-white': result === 'correct' && option === currentLetter.answer,
            'bg-danger text-white': result === 'wrong' && option !== currentLetter.answer
          }"
          @dragover.prevent
          @drop="onDrop(option)"
        >
          {{ option }}
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="result" class="mt-4 fs-3 fw-bold" :class="{
      'text-success': result === 'correct',
      'text-danger': result === 'wrong'
    }">
      {{ result === 'correct' ? '🎉 Muito bem!' : '😬 Ups, tenta de novo' }}
    </div>

    <!-- Botón siguiente -->
    <button
      class="btn btn-lg btn-primary mt-4 px-5 py-2"
      @click="nextQuestion"
      :disabled="!result"
    >
      👉 Próxima
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const questions = [
  { letter: 'A', answer: 'A', options: ['A', 'B'] },
  { letter: 'M', answer: 'M', options: ['M', 'N'] },
  { letter: 'E', answer: 'E', options: ['F', 'E'] },
  { letter: 'T', answer: 'T', options: ['L', 'T'] },
]

const index = ref(0)
const result = ref(null)
const currentLetter = ref(questions[index.value])
const draggedLetter = ref(null)

let audioCorrect = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    audioCorrect = new Audio('/audio/boa.mp3')
    speakText("Com qual é que se assemelha?")
  }
})

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "pt-PT"
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

const onDragStart = (event) => {
  event.dataTransfer.setData('text/plain', currentLetter.value.letter)
  draggedLetter.value = currentLetter.value.letter
}

const onTouchStart = () => {
  draggedLetter.value = currentLetter.value.letter
}

const onTouchEnd = (event) => {
  const touch = event.changedTouches[0]
  const element = document.elementFromPoint(touch.clientX, touch.clientY)

  if (element && element.classList.contains('dropzone')) {
    const selectedOption = element.innerText.trim()
    onDrop(selectedOption)
  }
}

const onDrop = (option) => {
  const dragged = draggedLetter.value
  if (option === dragged) {
    result.value = 'correct'
    audioCorrect?.play()
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
    speakText("Muito bem! Terminaste o jogo!")
    index.value = 0
    currentLetter.value = questions[0]
  }
}
</script>

<style scoped>
.draggable-letter {
  font-size: 6rem;
  font-weight: bold;
  color: #0dcaf0;
  background: #e7f9ff;
  width: 140px;
  height: 140px;
  line-height: 140px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: grab;
  user-select: none;
}

.dropzone {
  min-height: 120px;
  border: 4px dashed #ccc;
  border-radius: 20px;
  padding: 30px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropzone:hover {
  border-color: #0d6efd;
  background: #eef5ff;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
