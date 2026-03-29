<template>
  <div class="active-child-switcher">
    <label class="active-child-switcher__label" for="active-child-select">
      {{ t('common.childProfile.label') }}
    </label>

    <select
      id="active-child-select"
      class="active-child-switcher__select"
      :value="activeChildId"
      :disabled="isDisabled"
      @change="onChange"
    >
      <option v-if="isLoading && !children.length" :value="activeChildId">
        {{ t('common.childProfile.loading') }}
      </option>
      <option v-else-if="!children.length" :value="activeChildId">
        {{ t('common.childProfile.empty') }}
      </option>
      <option v-for="child in children" :key="child.id" :value="child.id">
        {{ child.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChildProfiles } from '@/composables/useChildProfiles'

const { t } = useI18n()
const { activeChildId, children, isLoading, loadChildren, setActiveChildId } = useChildProfiles()

const isDisabled = computed(() => isLoading.value || children.value.length <= 1)

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setActiveChildId(Number(target.value))
}

onMounted(() => {
  void loadChildren()
})
</script>

<style scoped>
.active-child-switcher {
  display: grid;
  gap: 0.2rem;
}

.active-child-switcher__label {
  color: #71819a;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.active-child-switcher__select {
  min-width: 10rem;
  max-width: 11.5rem;
  padding: 0.55rem 2rem 0.55rem 0.9rem;
  border: 1px solid rgba(42, 94, 170, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #1d3250;
  font-size: 0.96rem;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(28, 50, 80, 0.08);
}

.active-child-switcher__select:focus-visible {
  outline: 3px solid rgba(37, 109, 255, 0.22);
  outline-offset: 3px;
}

.active-child-switcher__select:disabled {
  color: #7d8da4;
  box-shadow: none;
  cursor: default;
}

@media (max-width: 991px) {
  .active-child-switcher {
    width: 100%;
    margin-top: 0.75rem;
  }

  .active-child-switcher__select {
    max-width: none;
    width: 100%;
  }
}
</style>
