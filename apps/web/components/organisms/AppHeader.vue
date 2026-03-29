<template>
  <header>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-0">
      <NuxtLink class="navbar-brand" to="/" :aria-label="t('common.accessibility.home')">
        <img src="/images/global/logo.webp" alt="Logo aprende con Coco" class="img-logo" />
      </NuxtLink>

      <div class="header-access d-none d-lg-flex">
        <ChildAccountMenu v-if="showAccountMenu" />
        <NuxtLink
          v-else-if="showLoginButton"
          :to="APP_ROUTES.login"
          class="header-login"
        >
          {{ t('common.nav.login') }}
        </NuxtLink>
      </div>

      <div class="mobile-controls d-lg-none">
        <ChildAccountMenu
          v-if="showAccountMenu"
          class="mobile-account-trigger"
        />
        <NuxtLink
          v-else-if="showLoginButton"
          :to="APP_ROUTES.login"
          class="header-login header-login--mobile"
        >
          {{ t('common.nav.login') }}
        </NuxtLink>
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
      </div>

      <div
        class="collapse navbar-collapse justify-content-end align-items-center gap-3"
        id="navbarContent"
      >
        <template v-if="showNavigationLinks">
          <AppNavLinks />
        </template>

        <div class="header-locale">
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_ROUTES } from '@/constants/routes'
import { useAuthSession } from '@/composables/useAuthSession'
import AppNavLinks from '@/components/molecules/AppNavLinks.vue'
import ChildAccountMenu from '@/components/molecules/ChildAccountMenu.vue'
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthSession()

const isAuthRoute = computed(() => [APP_ROUTES.login, APP_ROUTES.register].includes(route.path))

const showNavigationLinks = computed(() => !isAuthRoute.value)
const showLoginButton = computed(() => !auth.isAuthenticated.value && !isAuthRoute.value)
const showAccountMenu = computed(() => auth.isAuthenticated.value && !isAuthRoute.value)

onMounted(() => {
  void auth.ensureSession()
})
</script>

<style scoped>
.img-logo {
  width: 6rem;
  height: 6rem;
}

.navbar {
  position: relative;
}

.mobile-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.header-access {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.header-login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.15rem;
  border-radius: 999px;
  background: #edf3ff;
  color: #2559c8;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.header-login:hover,
.header-login:focus-visible {
  background: #dfeaff;
  color: #1844a5;
}

.header-login:focus-visible {
  outline: 3px solid rgba(13, 110, 253, 0.24);
  outline-offset: 3px;
}

.header-login--mobile {
  padding: 0.42rem 0.85rem;
  font-size: 0.95rem;
}

.mobile-account-trigger {
  flex: 0 1 auto;
}

.header-locale {
  display: flex;
  align-items: center;
}

@media (max-width: 991px) {
  .navbar-collapse {
    padding: 0.75rem 0 1rem;
  }

  .header-access {
    position: static;
    transform: none;
  }

  .header-locale {
    justify-content: flex-start;
    width: 100%;
    padding-top: 0.35rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-login {
    transition: none;
  }
}
</style>
