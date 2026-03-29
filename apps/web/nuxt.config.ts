export default defineNuxtConfig({
  buildDir: '../../node_modules/.cache/nuxt/apps-web/.nuxt',
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'flag-icons/css/flag-icons.min.css',
    '@/assets/css/custom.css'
  ],
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Fredoka: [400, 500, 700],
    },
    display: 'swap'
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8081'
    }
  },

  compatibilityDate: '2025-03-23'
})
