<template>
  <div class="story-container">
    <div class="story-content">
      <div class="story-image">
        <img :src="currentPage.image" alt="Imagen del cuento" />
      </div>
      <div class="story-text">
        <h2>{{ currentPage.title }}</h2>
        <p>{{ currentPage.text }}</p>
      </div>
    </div>
    <div class="nav-buttons">
      <button @click="prevPage" :disabled="currentPageIndex === 0">← Anterior</button>
      <button @click="nextPage" :disabled="currentPageIndex === pages.length - 1">Siguiente →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const pages = [
  {
    title: "Capítulo 1: El Barco Sorpresa",
    image: "/images/stories/barco/cap-1.png",
    text: `Una mañana, Coco encontró una carta junto a su cuenco de comida:
“Querido Coco, ¡te invitamos a un viaje en barco!
Firma: Capitán Pez”.

Coco ladró emocionado y corrió al muelle.
Allí le esperaba un barquito pequeño con una bandera que decía:
“Aventura comienza aquí”.`,
  },
  {
    title: "Capítulo 2: La ballena que cantaba",
    image: "/images/stories/barco/cap-2.png",
    text: `Navegando por el mar azul, Coco escuchó una melodía.
—¿Quién canta tan bonito? —preguntó.

¡Era una ballena!
—Hola, Coco. ¿Puedes ayudarme a encontrar mi eco?

Coco ladró fuerte y la ballena sonrió al escucharlo rebotar.
—¡Gracias! —dijo—. ¡Tu voz me hizo sonreír!`,
  },
  {
    title: "Capítulo 3: El pulpo enredado",
    image: "/images/stories/barco/cap-3.png",
    text: `Entre olas suaves, Coco vio burbujas y... ¡tentáculos!
Un pulpo se había enredado con una red de pesca.
—¡No puedo bailar! —se lamentó.

Coco mordisqueó la red y la soltó.
El pulpo giró sobre sí mismo feliz:
—¡Eres un héroe con patas peludas!`,
  },
  {
    title: "Capítulo 4: La tormenta traviesa",
    image: "/images/stories/barco/cap-4.png",
    text: `El cielo se volvió gris. ¡Rayos! ¡Truenos!
Coco se escondió bajo una manta en el barco.
Pero luego pensó:
—¿Y si las olas también están asustadas?

Salió, miró al cielo y dijo:
—¡Todo va a estar bien!

Y la tormenta... se fue.`,
  },
  {
    title: "Capítulo 5: El tesoro invisible",
    image: "/images/stories/barco/cap-5.png",
    text: `Una luz brilló en el agua. Coco siguió el reflejo...
Pero al llegar, solo había una botella con un papel:

“El tesoro más brillante es tener amigos y ser valiente”.

Coco sonrió.
—¡Este es el mejor viaje de mi vida!”`,
  },
]

const currentPageIndex = ref(0)
const currentPage = computed(() => pages[currentPageIndex.value])

const nextPage = () => {
  if (currentPageIndex.value < pages.length - 1) currentPageIndex.value++
}
const prevPage = () => {
  if (currentPageIndex.value > 0) currentPageIndex.value--
}
</script>

<style scoped>
.story-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  border: 3px solid #a8c3e5;
  border-radius: 15px;
  background: #f7faff;
  box-shadow: 0 8px 20px rgba(50, 70, 120, 0.15);
}

.story-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.story-image {
  flex: 1;
}

.story-image img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(30, 60, 100, 0.2);
}

.story-text {
  flex: 1;
  font-size: 1.2rem;
  line-height: 1.6;
}

.story-text h2 {
  margin-bottom: 1rem;
  color: #486b9f;
  font-size: 1.8rem;
}

.nav-buttons {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
}

.nav-buttons button {
  background: #c3d4f6;
  border: 2px solid #6c88b0;
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s;
  color: #2e3d5c;
}

.nav-buttons button:hover:not(:disabled) {
  background: #a9c0ea;
}

.nav-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .story-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
