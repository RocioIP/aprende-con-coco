import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defaultLocale, messages, type AppLocale } from '@/lang'

export default defineNuxtPlugin((nuxtApp) => {
  const locale = useCookie<AppLocale>('locale', {
    default: () => defaultLocale,
    sameSite: 'lax',
  })

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: locale.value,
    fallbackLocale: defaultLocale,
    messages,
  })

  nuxtApp.vueApp.use(i18n)

  const syncLocale = (value: AppLocale) => {
    i18n.global.locale.value = value
  }

  syncLocale(locale.value)

  watch(
    locale,
    (value) => {
      if (!value) return
      syncLocale(value)
    },
    { immediate: false }
  )

  return {
    provide: {
      changeLocale: (value: AppLocale) => {
        locale.value = value
        syncLocale(value)
      },
    },
  }
})
