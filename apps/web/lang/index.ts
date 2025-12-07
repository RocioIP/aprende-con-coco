import es from './es'
import pt from './pt'

export const messages = {
  es,
  pt,
} as const

export type AppLocale = keyof typeof messages

export const defaultLocale: AppLocale = 'es'

export const speechVoices: Record<AppLocale, string> = {
  es: 'es-ES',
  pt: 'pt-PT',
}
