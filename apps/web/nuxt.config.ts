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
    apiProxyTarget: process.env.API_PROXY_TARGET || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8081',
    public: {
      apiBase: '/api'
    }
  },

  compatibilityDate: '2025-03-23'
})
