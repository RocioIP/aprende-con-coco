<template>
  <section class="profile-screen">
    <div class="profile-screen__hero">
      <span class="profile-screen__eyebrow">{{ t('profile.eyebrow') }}</span>
      <h1 class="profile-screen__title">{{ t('profile.title') }}</h1>
      <p class="profile-screen__description">{{ t('profile.description') }}</p>
    </div>

    <form v-if="child" class="profile-card" @submit.prevent="handleSubmit">
      <label class="profile-card__field">
        <span>{{ t('auth.fields.name') }}</span>
        <input v-model="form.name" type="text" required />
      </label>

      <label class="profile-card__field">
        <span>{{ t('auth.fields.gender') }}</span>
        <select v-model="form.gender">
          <option value="boy">{{ t('auth.gender.boy') }}</option>
          <option value="girl">{{ t('auth.gender.girl') }}</option>
        </select>
      </label>

      <label class="profile-card__field">
        <span>{{ t('auth.fields.birthdate') }}</span>
        <input v-model="form.birthdate" type="date" required />
      </label>

      <p class="profile-card__hint">{{ t('profile.loginNameHint', { name: child.name }) }}</p>
      <p v-if="feedbackMessage" class="profile-card__feedback">{{ feedbackMessage }}</p>
      <p v-if="errorMessage" class="profile-card__error">{{ translateError(errorMessage) }}</p>

      <button type="submit" class="profile-card__submit" :disabled="isLoading">
        {{ isLoading ? t('profile.saving') : t('profile.save') }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthSession } from '@/composables/useAuthSession'
import type { ChildGender } from '@/types/auth'

const { t } = useI18n()
const { child, ensureSession, errorMessage, isLoading, updateProfile } = useAuthSession()

const feedbackMessage = ref('')
const form = reactive<{
  birthdate: string
  gender: ChildGender
  name: string
}>({
  birthdate: '',
  gender: 'boy',
  name: '',
})

function formatDateInput(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

function syncForm() {
  if (!child.value) {
    return
  }

  form.name = child.value.name
  form.gender = child.value.gender
  form.birthdate = formatDateInput(child.value.birthdate)
}

function translateError(message: string) {
  const key = `auth.errors.${message}`
  return t(key)
}

async function handleSubmit() {
  feedbackMessage.value = ''

  try {
    await updateProfile({
      name: form.name,
      gender: form.gender,
      birthdate: form.birthdate,
    })
    feedbackMessage.value = t('profile.saved')
  } catch {
    feedbackMessage.value = ''
  }
}

watch(child, syncForm, { immediate: true })

onMounted(() => {
  void ensureSession()
})
</script>

<style scoped>
.profile-screen {
  min-height: calc(100dvh - 6rem);
  padding: 1.75rem 1rem 2.5rem;
  background:
    radial-gradient(circle at top left, rgba(255, 236, 198, 0.7), transparent 25%),
    linear-gradient(180deg, #f8fbff 0%, #f5f9ff 100%);
}

.profile-screen__hero,
.profile-card {
  width: min(100%, 42rem);
  margin-inline: auto;
}

.profile-screen__eyebrow {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #61738d;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.profile-screen__title {
  margin: 1rem 0 0;
  color: #1d3250;
  font-size: clamp(2rem, 4vw, 2.6rem);
}

.profile-screen__description {
  margin: 0.7rem 0 0;
  color: #5f7089;
  line-height: 1.6;
}

.profile-card {
  display: grid;
  gap: 1rem;
  margin-top: 1.3rem;
  padding: 1.4rem;
  border-radius: 1.8rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(28, 50, 80, 0.1);
}

.profile-card__field {
  display: grid;
  gap: 0.45rem;
}

.profile-card__field span {
  color: #44566f;
  font-weight: 700;
}

.profile-card__field input,
.profile-card__field select {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(37, 109, 255, 0.14);
  border-radius: 1rem;
  background: #f8fbff;
  color: #1d3250;
}

.profile-card__field input:focus-visible,
.profile-card__field select:focus-visible {
  outline: 3px solid rgba(37, 109, 255, 0.2);
  outline-offset: 2px;
}

.profile-card__hint,
.profile-card__feedback,
.profile-card__error {
  margin: 0;
}

.profile-card__hint {
  color: #607089;
}

.profile-card__feedback {
  color: #16805b;
  font-weight: 700;
}

.profile-card__error {
  color: #bf3358;
  font-weight: 700;
}

.profile-card__submit {
  justify-self: start;
  padding: 0.82rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #2f83ff 0%, #4f57ff 100%);
  color: #ffffff;
  font-weight: 800;
}

.profile-card__submit:disabled {
  opacity: 0.7;
}
</style>
