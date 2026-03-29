<template>
  <ProgressDashboardScreen />
</template>

<script setup lang="ts">
import ProgressDashboardScreen from '@/components/organisms/ProgressDashboardScreen.vue'

definePageMeta({
  middleware: 'admin',
})
</script>
