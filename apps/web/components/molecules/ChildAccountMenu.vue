<template>
  <div ref="menuRef" class="account-menu">
    <button
      type="button"
      class="account-menu__trigger"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="isOpen = !isOpen"
    >
      <span class="account-menu__name">{{ child?.name }}</span>
      <span v-if="adminUnlocked" class="account-menu__badge">{{ t('auth.adminBadge') }}</span>
    </button>

    <div v-if="isOpen" class="account-menu__panel">
      <button type="button" class="account-menu__item" @click="openProtectedRoute(APP_ROUTES.profile)">
        {{ t('auth.menu.profile') }}
      </button>
      <button type="button" class="account-menu__item" @click="openProtectedRoute(APP_ROUTES.progress)">
        {{ t('auth.menu.progress') }}
      </button>
      <button type="button" class="account-menu__item account-menu__item--danger" @click="handleLogout">
        {{ t('auth.menu.logout') }}
      </button>
    </div>

    <AdminUnlockDialog
      :open="isDialogOpen"
      :is-loading="isLoading"
      :error-message="unlockErrorMessage"
      @close="closeDialog"
      @submit="submitUnlock"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_ROUTES } from '@/constants/routes'
import { useAuthSession } from '@/composables/useAuthSession'
import AdminUnlockDialog from '@/components/molecules/AdminUnlockDialog.vue'

const { t } = useI18n()
const { adminUnlocked, child, isLoading, logout, unlockAdmin } = useAuthSession()

const isOpen = ref(false)
const isDialogOpen = ref(false)
const pendingRoute = ref<string | null>(null)
const unlockErrorMessage = ref('')
const menuRef = ref<HTMLElement | null>(null)

function closeDialog() {
  isDialogOpen.value = false
  pendingRoute.value = null
  unlockErrorMessage.value = ''
}

async function submitUnlock(password: string) {
  unlockErrorMessage.value = ''

  try {
    await unlockAdmin({ adminPassword: password })
    isDialogOpen.value = false
    const nextRoute = pendingRoute.value
    pendingRoute.value = null

    if (nextRoute) {
      await navigateTo(nextRoute)
    }
  } catch {
    unlockErrorMessage.value = t('auth.errors.invalid_admin_password')
  }
}

async function openProtectedRoute(route: string) {
  isOpen.value = false

  if (adminUnlocked.value) {
    await navigateTo(route)
    return
  }

  pendingRoute.value = route
  isDialogOpen.value = true
}

async function handleLogout() {
  isOpen.value = false
  await logout()
  await navigateTo(APP_ROUTES.login)
}

function handleDocumentClick(event: MouseEvent) {
  if (!menuRef.value) {
    return
  }

  if (menuRef.value.contains(event.target as Node)) {
    return
  }

  isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.account-menu {
  position: relative;
}

.account-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  justify-content: center;
  padding: 0.6rem 1.15rem;
  border: 1px solid rgba(37, 109, 255, 0.08);
  border-radius: 999px;
  background: #edf3ff;
  color: #2559c8;
  font-weight: 800;
  box-shadow: none;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.account-menu__trigger:hover,
.account-menu__trigger:focus-visible {
  background: #dfeaff;
  color: #1844a5;
}

.account-menu__trigger:focus-visible {
  outline: 3px solid rgba(37, 109, 255, 0.22);
  outline-offset: 3px;
}

.account-menu__name {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu__badge {
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  background: rgba(51, 194, 127, 0.14);
  color: #1e8f61;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.account-menu__panel {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 25;
  display: grid;
  min-width: 12.5rem;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(23, 37, 61, 0.14);
}

.account-menu__item {
  padding: 0.75rem 0.9rem;
  border: 0;
  border-radius: 0.8rem;
  background: transparent;
  color: #1d3250;
  font-weight: 700;
  text-align: left;
}

.account-menu__item:is(:hover, :focus-visible) {
  background: #f4f8ff;
}

.account-menu__item--danger {
  color: #c24d4d;
}

@media (max-width: 991px) {
  .account-menu {
    width: 100%;
  }

  .account-menu__trigger {
    width: 100%;
    justify-content: space-between;
  }

  .account-menu__panel {
    left: 0;
    right: auto;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-menu__trigger {
    transition: none;
  }
}
</style>
