<template>
  <section class="games-section">
    <div class="container py-5">
      <header class="games-section__header">
        <p class="games-section__eyebrow">Coco</p>
        <h1 class="games-section__title">{{ title }}</h1>
        <p class="games-section__description">{{ description }}</p>
      </header>

      <GameCatalogGrid :items="gameCards" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCatalogGrid from '@/components/molecules/GameCatalogGrid.vue'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useGamesCatalogStore } from '@/stores/games/catalog'

const { t } = useI18n()
const catalogStore = useGamesCatalogStore()
const { speak } = useSpeechSynthesis()

const title = computed(() => t('games.index.title'))
const description = computed(() => t('games.index.description'))
const gameCards = computed(() =>
  catalogStore.orderedItems.map((item) => ({
    id: item.id,
    to: item.to,
    image: item.image,
    title: t(item.titleKey),
    description: t(item.descriptionKey),
    alt: t(item.altKey),
  }))
)

function announceSection() {
  speak(title.value)
}

onMounted(() => {
  announceSection()
})

watch(title, () => {
  announceSection()
})
</script>

<style scoped>
.games-section {
  min-height: calc(100dvh - 6rem);
  background:
    radial-gradient(circle at top left, rgba(255, 228, 171, 0.55), transparent 28%),
    radial-gradient(circle at top right, rgba(135, 206, 250, 0.35), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #fffaf0 100%);
}

.games-section__header {
  max-width: 720px;
  margin: 0 auto 2.5rem;
  text-align: center;
}

.games-section__eyebrow {
  margin: 0 0 0.5rem;
  color: #ff8c00;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.games-section__title {
  margin: 0 0 0.75rem;
  color: #17324d;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 700;
}

.games-section__description {
  margin: 0;
  color: #52677f;
  font-size: 1.05rem;
  line-height: 1.6;
}
</style>
