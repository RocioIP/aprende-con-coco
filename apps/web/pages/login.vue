<template>
  <AuthShell
    :eyebrow="t('auth.login.eyebrow')"
    :title="t('auth.login.title')"
    :description="t('auth.login.description')"
    :switch-label="t('auth.login.switchLabel')"
    :switch-action="t('auth.login.switchAction')"
    :switch-to="APP_ROUTES.register"
  >
    <form class="auth-form" @submit.prevent="handleSubmit">
      <label class="auth-form__field">
        <span>{{ t('auth.fields.name') }}</span>
        <input v-model="form.name" type="text" autocomplete="username" required />
      </label>

      <label class="auth-form__field">
        <span>{{ t('auth.fields.password') }}</span>
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="errorText" class="auth-form__error">{{ errorText }}</p>

      <button type="submit" class="auth-form__submit" :disabled="isLoading">
        {{ isLoading ? t('auth.actions.entering') : t('auth.actions.enter') }}
      </button>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthShell from '@/components/organisms/AuthShell.vue'
import { APP_ROUTES } from '@/constants/routes'
import { useAuthSession } from '@/composables/useAuthSession'

const { t } = useI18n()
const { errorMessage, isLoading, loginChild } = useAuthSession()
const form = reactive({
  name: '',
  password: '',
})

const errorText = computed(() => {
  if (!errorMessage.value) {
    return ''
  }

  return t(`auth.errors.${errorMessage.value}`)
})

async function handleSubmit() {
  try {
    await loginChild({
      name: form.name,
      password: form.password,
    })
    await navigateTo(APP_ROUTES.home)
  } catch {
    // handled in state
  }
}
</script>

<style scoped>
.auth-form {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.auth-form__field {
  display: grid;
  gap: 0.4rem;
}

.auth-form__field span {
  color: #44566f;
  font-weight: 700;
}

.auth-form__field input,
.auth-form__field select {
  width: 100%;
  padding: 0.88rem 1rem;
  border: 1px solid rgba(37, 109, 255, 0.14);
  border-radius: 1rem;
  background: #f8fbff;
  color: #1d3250;
}

.auth-form__error {
  margin: 0;
  color: #bf3358;
  font-weight: 700;
}

.auth-form__submit {
  margin-top: 0.3rem;
  padding: 0.9rem 1.15rem;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #2f83ff 0%, #4f57ff 100%);
  color: #ffffff;
  font-weight: 800;
}
</style>
