<template>
  <div class="mt-4 d-flex flex-column justify-content-center align-items-center text-center p-4">
    <div class="mb-3">
      <div class="badge rounded-pill text-dark p-4 fs-4 shadow">
        {{ displayedText }} 👋
      </div>
    </div>

    <div class="mb-4">
      <img
        src="/images/global/coco-saludando.jpg"
        alt="Coco saludando"
        class="img-fluid"
        style="width: 15rem; height: auto; cursor: pointer;"
        @click="repeatSpeech"
      />
    </div>

    <div class="d-flex gap-5">
      <NuxtLink to="/games" @click="stopSpeaking" class="btn btn-warning btn-lg rounded-pill shadow-sm pulse-button">
        {{ t('common.nav.games') }}
      </NuxtLink>
      <NuxtLink to="/stories" @click="stopSpeaking" class="btn btn-primary btn-lg rounded-pill shadow-sm pulse-button">
        {{ t('common.nav.stories') }}
      </NuxtLink>
      <NuxtLink to="/blackboard" @click="stopSpeaking" class="btn btn-danger btn-lg rounded-pill shadow-sm pulse-button">
        {{ t('common.nav.blackboard') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { speechVoices } from '@/lang'

const TYPING_INTERVAL_MS = 100

const { t, locale } = useI18n()
const displayedText = ref('')
const fullText = computed(() => t('home.greeting'))
const voice = computed(() => speechVoices[locale.value] ?? speechVoices.es)

let typingInterval: ReturnType<typeof setInterval> | null = null
let mounted = false

function typeTextAndSpeak() {
  if (!import.meta.client) return
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }

  const text = fullText.value
  displayedText.value = ''
  let index = 0

  typingInterval = setInterval(() => {
    displayedText.value += text[index] ?? ''
    index++
    if (index >= text.length && typingInterval) {
      clearInterval(typingInterval)
      typingInterval = null
    }
  }, TYPING_INTERVAL_MS)

  speakText(text)
}

function speakText(text = fullText.value) {
  if (!import.meta.client) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voice.value
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

function repeatSpeech() {
  speakText()
}

function stopSpeaking() {
  if (!import.meta.client) return
  speechSynthesis.cancel()
}

onMounted(() => {
  mounted = true
  typeTextAndSpeak()
})

onBeforeUnmount(() => {
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  stopSpeaking()
})

watch(fullText, () => {
  if (!mounted) return
  typeTextAndSpeak()
})
</script>

<style scoped>
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.75;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-button {
  animation: pulse 1.5s infinite;
  padding: 10px 25px;
  font-size: 1.5rem;
}
</style>
