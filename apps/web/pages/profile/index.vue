<template>
  <ProfileSettingsScreen />
</template>

<script setup lang="ts">
import ProfileSettingsScreen from '@/components/organisms/ProfileSettingsScreen.vue'

definePageMeta({
  middleware: 'admin',
})
</script>
