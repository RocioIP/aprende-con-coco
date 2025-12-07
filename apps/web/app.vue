<template>
  <div>
    <AppHeader />
    <NuxtPage />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/organisms/AppHeader.vue'
onMounted(async () => {
  await import('bootstrap/dist/js/bootstrap.bundle.min.js');
})

</script>