<template>
  <div v-if="open" class="admin-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
    <div class="admin-dialog__backdrop" @click="emit('close')"></div>

    <div class="admin-dialog__card">
      <div class="admin-dialog__head">
        <div>
          <p class="admin-dialog__eyebrow">{{ t('auth.adminPrompt.eyebrow') }}</p>
          <h2 :id="titleId" class="admin-dialog__title">{{ t('auth.adminPrompt.title') }}</h2>
        </div>
        <button type="button" class="admin-dialog__close" @click="emit('close')">
          {{ t('common.buttons.close') }}
        </button>
      </div>

      <p class="admin-dialog__description">{{ t('auth.adminPrompt.description') }}</p>

      <form class="admin-dialog__form" @submit.prevent="emit('submit', password)">
        <label class="admin-dialog__label" for="admin-password">
          {{ t('auth.fields.adminPassword') }}
        </label>
        <input
          id="admin-password"
          v-model="password"
          class="admin-dialog__input"
          type="password"
          autocomplete="current-password"
          required
        />

        <p v-if="errorMessage" class="admin-dialog__error">{{ errorMessage }}</p>

        <div class="admin-dialog__actions">
          <button type="button" class="admin-dialog__secondary" @click="emit('close')">
            {{ t('auth.actions.cancel') }}
          </button>
          <button type="submit" class="admin-dialog__primary" :disabled="isLoading">
            {{ isLoading ? t('auth.actions.unlocking') : t('auth.actions.unlock') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  errorMessage: string
  isLoading: boolean
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [password: string]
}>()

const { t } = useI18n()
const password = ref('')
const titleId = 'admin-unlock-title'

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      password.value = ''
    }
  }
)
</script>

<style scoped>
.admin-dialog {
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.admin-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(17, 27, 44, 0.48);
  backdrop-filter: blur(4px);
}

.admin-dialog__card {
  position: relative;
  width: min(100%, 28rem);
  padding: 1.35rem;
  border-radius: 1.75rem;
  background: #ffffff;
  box-shadow: 0 28px 54px rgba(23, 37, 61, 0.18);
}

.admin-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-dialog__eyebrow {
  margin: 0;
  color: #5f7390;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.admin-dialog__title {
  margin: 0.3rem 0 0;
  color: #1d3250;
  font-size: 1.45rem;
}

.admin-dialog__close {
  border: 0;
  background: none;
  color: #607089;
  font-weight: 700;
}

.admin-dialog__description {
  margin: 0.85rem 0 0;
  color: #607089;
  line-height: 1.5;
}

.admin-dialog__form {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.admin-dialog__label {
  color: #42546f;
  font-weight: 700;
}

.admin-dialog__input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(37, 109, 255, 0.14);
  border-radius: 1rem;
  background: #f8fbff;
  color: #1d3250;
}

.admin-dialog__input:focus-visible {
  outline: 3px solid rgba(37, 109, 255, 0.2);
  outline-offset: 2px;
}

.admin-dialog__error {
  margin: 0;
  color: #bf3358;
  font-weight: 700;
}

.admin-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.3rem;
}

.admin-dialog__secondary,
.admin-dialog__primary {
  border: 0;
  border-radius: 999px;
  padding: 0.72rem 1.1rem;
  font-weight: 700;
}

.admin-dialog__secondary {
  background: rgba(92, 113, 145, 0.12);
  color: #51627c;
}

.admin-dialog__primary {
  background: linear-gradient(135deg, #2f83ff 0%, #4f57ff 100%);
  color: #ffffff;
}

.admin-dialog__primary:disabled {
  opacity: 0.7;
}

@media (max-width: 640px) {
  .admin-dialog__head,
  .admin-dialog__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
