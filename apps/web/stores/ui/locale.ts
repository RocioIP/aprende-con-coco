import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { defaultLocale, type AppLocale } from '@/lang'

interface LocaleOption {
  code: AppLocale
  label: string
  flagClass: string
}

type ChangeLocaleFn = (value: AppLocale) => void

const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'es', label: 'Espanol', flagClass: 'fi-es' },
  { code: 'pt', label: 'Portugues', flagClass: 'fi-pt' },
]

export const useLocaleStore = defineStore('ui-locale', () => {
  const localeCookie = useCookie<AppLocale>('locale', {
    default: () => defaultLocale,
    sameSite: 'lax',
  })

  const { locale } = useI18n()
  const nuxtApp = useNuxtApp()
  const current = computed(() => locale.value as AppLocale)
  const currentLanguage = computed(
    () => LOCALE_OPTIONS.find((option) => option.code === current.value) ?? LOCALE_OPTIONS[0]
  )

  function setLocale(value: AppLocale) {
    if (current.value === value) return

    localeCookie.value = value

    const changeLocale = (
      nuxtApp as typeof nuxtApp & { $changeLocale?: ChangeLocaleFn }
    ).$changeLocale

    if (changeLocale) {
      changeLocale(value)
      return
    }

    locale.value = value
  }

  return {
    current,
    currentLanguage,
    options: LOCALE_OPTIONS,
    setLocale,
  }
})
