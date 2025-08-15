<template>
  <div>
    <AppHeader />
    <NuxtPage />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue'
onMounted(async () => {
  console.log("🔥 Bootstrap cargado desde App.vue");
  await import('bootstrap/dist/js/bootstrap.bundle.min.js');
})

</script>