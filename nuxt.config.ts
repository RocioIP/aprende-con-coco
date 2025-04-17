export default defineNuxtConfig({
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '@/assets/css/custom.css'
  ],
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Fredoka: [400, 500, 700],
    },
    display: 'swap'
  },

  compatibilityDate: '2025-03-23'
})