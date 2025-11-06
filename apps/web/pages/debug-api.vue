<template>
  <div class="p-8">
    <h1>Debug API</h1>
    <p>API base: {{ apiBase }}</p>

    <div class="flex gap-3 my-3">
      <button @click="ping">/health</button>
      <button @click="children">/children</button>
    </div>

    <h3>Respuesta</h3>
    <pre>{{ data }}</pre>

    <h3 v-if="err">Error</h3>
    <pre v-if="err">{{ err }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

const { public: { apiBase } } = useRuntimeConfig()
const data = ref<any>(null)
const err  = ref<any>(null)

async function ping () {
  try {
    data.value = await $fetch(`${apiBase}/health`)
    err.value = null
  } catch (e: any) {
    err.value = e?.data || e?.message || String(e)
  }
}
async function children () {
  try {
    data.value = await $fetch(`${apiBase}/children`)
    err.value = null
  } catch (e: any) {
    err.value = e?.data || e?.message || String(e)
  }
}
</script>
