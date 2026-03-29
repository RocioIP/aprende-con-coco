<template>
  <div
    ref="dropdownRef"
    class="language-dropdown"
    @keydown.esc.stop.prevent="closeDropdown"
  >
    <AppFlagButton
      class="lang-toggle"
      :active="isDropdownOpen"
      :aria-controls="menuId"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="menu"
      :flag-class="localeStore.currentLanguage.flagClass"
      :label="t('common.accessibility.changeLanguage')"
      @click.stop="toggleDropdown"
      @keydown.down.prevent="openDropdownAndFocus"
    />

    <ul
      v-if="isDropdownOpen"
      :id="menuId"
      class="lang-menu"
      :aria-label="t('common.accessibility.changeLanguage')"
      role="menu"
      @keydown="handleMenuKeydown"
    >
      <li v-for="option in localeStore.options" :key="option.code" role="none">
        <AppFlagButton
          class="lang-option"
          :active="localeStore.current === option.code"
          :aria-checked="localeStore.current === option.code"
          :flag-class="option.flagClass"
          :label="option.label"
          role="menuitemradio"
          @click.stop="selectLocale(option.code)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import AppFlagButton from '@/components/atoms/AppFlagButton.vue'
import { useLocaleStore } from '@/stores/ui/locale'
import type { AppLocale } from '@/lang'

const { t } = useI18n()
const localeStore = useLocaleStore()
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const menuId = `locale-switcher-menu-${useId().replace(/:/g, '')}`

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value

  if (isDropdownOpen.value) {
    void nextTick(() => focusOption(0))
  }
}

async function openDropdownAndFocus() {
  if (isDropdownOpen.value) return

  isDropdownOpen.value = true
  await nextTick()
  focusOption(0)
}

function closeDropdown() {
  isDropdownOpen.value = false
}

function selectLocale(code: AppLocale) {
  localeStore.setLocale(code)
  closeDropdown()
}

function handleClickOutside(event: MouseEvent) {
  if (!dropdownRef.value) return

  if (!dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function getOptionButtons() {
  if (!dropdownRef.value) return []

  return Array.from(
    dropdownRef.value.querySelectorAll<HTMLButtonElement>('.lang-option')
  )
}

function focusOption(index: number) {
  getOptionButtons()[index]?.focus()
}

function handleMenuKeydown(event: KeyboardEvent) {
  const optionButtons = getOptionButtons()

  if (optionButtons.length === 0) return

  const currentIndex = optionButtons.findIndex((button) => button === document.activeElement)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusOption((currentIndex + 1 + optionButtons.length) % optionButtons.length)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusOption((currentIndex - 1 + optionButtons.length) % optionButtons.length)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    focusOption(0)
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    focusOption(optionButtons.length - 1)
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
.language-dropdown {
  position: relative;
}

.lang-toggle {
  padding: 0.2rem;
  border-radius: 999px;
}

.lang-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  display: grid;
  gap: 0.2rem;
  margin: 0;
  padding: 0.35rem;
  min-width: 74px;
  list-style: none;
  border: 1px solid #d1d7e0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  z-index: 20;
}

.lang-option {
  width: 100%;
  padding: 0.35rem 0.45rem;
  border-radius: 10px;
}

.lang-option:hover,
.lang-option.active,
.lang-toggle.active {
  background: rgba(13, 110, 253, 0.1);
}
</style>
