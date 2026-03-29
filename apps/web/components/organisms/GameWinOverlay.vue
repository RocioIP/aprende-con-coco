<template>
  <div class="win-overlay">
    <div class="win-card">
      <h1 class="display-6 fw-bold text-center mb-3">{{ title }}</h1>
      <img :src="imageSrc" :alt="imageAlt" class="img-coco-aplaudiendo" />
      <p v-if="message" class="mb-3">{{ message }}</p>
      <div class="d-flex gap-2 justify-content-center mt-4">
        <button class="btn-mais-uma" @click="emit('playAgain')">
          {{ resolvedPlayAgainLabel }}
        </button>
        <button class="btn-salir" @click="emit('close')">
          {{ resolvedCloseLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    closeLabel?: string
    imageAlt?: string
    imageSrc?: string
    message?: string
    playAgainLabel?: string
    title: string
  }>(),
  {
    closeLabel: '',
    imageAlt: 'Coco aplaudiendo',
    imageSrc: '/images/global/coco-aplaudiendo.webp',
    message: '',
    playAgainLabel: '',
  }
)

const emit = defineEmits<{
  close: []
  playAgain: []
}>()

const { t } = useI18n()

const resolvedPlayAgainLabel = computed(() => props.playAgainLabel || t('common.buttons.playAgain'))
const resolvedCloseLabel = computed(() => props.closeLabel || t('common.buttons.close'))

</script>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
  .btn-mais-uma,
  .btn-salir {
    transition: none;
  }

  .btn-mais-uma:hover,
  .btn-salir:hover {
    transform: none;
  }
}
</style>
