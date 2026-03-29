<template>
  <div class="row justify-content-center g-4">
    <div v-for="item in items" :key="item.id" class="col-12 col-sm-6 col-lg-3">
      <GameCatalogCard
        :alt="item.alt"
        :description="item.description"
        :image="item.image"
        :title="item.title"
        :to="item.to"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCatalogCard from '@/components/atoms/GameCatalogCard.vue'
import type { GameCardViewModel } from '@/types/games'

defineProps<{
  items: GameCardViewModel[]
}>()
</script>
