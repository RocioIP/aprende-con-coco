<template>
  <header>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-0">
      <NuxtLink class="navbar-brand" to="/">
        <img src="/public/images/global/logo.webp" alt="Logo aprende con Coco" class="img-logo">
      </NuxtLink>

      <div class="mobile-controls d-lg-none">
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="language-dropdown" ref="dropdownRef">
        <button
          type="button"
          class="lang-toggle"
          @click.stop="toggleDropdown"
          aria-label="Cambiar idioma"
        >
          <span
            class="flag"
            :class="['fi', currentLanguage.flagClass]"
            aria-hidden="true"
          ></span>
          <span class="sr-only">{{ currentLanguage.label }}</span>
        </button>
          <ul v-if="isDropdownOpen" class="lang-menu">
            <li v-for="lang in languages" :key="lang.code">
              <button
                type="button"
                class="lang-option"
                :class="{ active: currentLocale === lang.code }"
                :title="lang.label"
                @click.stop="selectLocale(lang.code)"
              >
                <span
                  class="flag"
                  :class="['fi', lang.flagClass]"
                  aria-hidden="true"
                ></span>
                <span class="sr-only">{{ lang.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="collapse navbar-collapse justify-content-end align-items-center gap-3"
        id="navbarContent"
      >
        <ul class="navbar-nav">
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/games">{{ t('common.nav.games') }}</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/stories">{{ t('common.nav.stories') }}</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/blackboard">{{ t('common.nav.blackboard') }}</NuxtLink>
          </li>
        </ul>
        <div class="language-dropdown d-none d-lg-block">
          <div class="d-flex align-items-center">
            <button
              type="button"
              class="lang-toggle"
              @click.stop="toggleDropdown"
              aria-label="Cambiar idioma"
            >
              <span
                class="flag"
                :class="['fi', currentLanguage.flagClass]"
                aria-hidden="true"
              ></span>
              <span class="sr-only">{{ currentLanguage.label }}</span>
            </button>
            <ul v-if="isDropdownOpen" class="lang-menu">
              <li v-for="lang in languages" :key="lang.code">
                <button
                  type="button"
                  class="lang-option"
                  :class="{ active: currentLocale === lang.code }"
                  :title="lang.label"
                  @click.stop="selectLocale(lang.code)"
                >
                  <span
                    class="flag"
                    :class="['fi', lang.flagClass]"
                    aria-hidden="true"
                  ></span>
                  <span class="sr-only">{{ lang.label }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const languages = [
  { code: 'es', label: 'Español', flagClass: 'fi-es' },
  { code: 'pt', label: 'Português', flagClass: 'fi-pt' },
] as const

const currentLocale = computed({
  get: () => locale.value,
  set: (value: typeof languages[number]['code']) => {
    locale.value = value
  },
})

const currentLanguage = computed(
  () => languages.find((lang) => lang.code === currentLocale.value) ?? languages[0]
)

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function closeDropdown() {
  isDropdownOpen.value = false
}

function selectLocale(code: typeof languages[number]['code']) {
  if (currentLocale.value === code) return
  currentLocale.value = code
  closeDropdown()
}

function handleClickOutside(event: MouseEvent) {
  if (!dropdownRef.value) return
  if (!dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.nav-link {
  font-weight: 500;
  font-size: 1.5rem;
}
.nav-link:hover {
  color: #0d6efd !important;
}

.img-logo {
  width: 6rem;
  height: 6rem;
}

.mobile-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.language-dropdown {
  position: relative;
}

.lang-toggle {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.flag {
  --fi-size: 1.7rem;
}

.lang-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  background: #fff;
  border: 1px solid #d1d7e0;
  border-radius: 12px;
  padding: 0.25rem;
  list-style: none;
  margin: 0;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  min-width: 70px;
  z-index: 10;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #0b132b;
  transition: background 0.2s ease;
}

.lang-option:hover,
.lang-option.active {
  background: rgba(13, 110, 253, 0.1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
