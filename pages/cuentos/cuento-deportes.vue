<template>
    <div class="storybook" @touchstart="startTouch" @touchend="endTouch">
      <div class="book-container">
        <!-- Página izquierda: Imagen -->
        <div class="page left-page">
          <img :src="currentPage.image" alt="Imagen del cuento" />
        </div>
  
        <!-- Página derecha: Texto -->
        <div class="page right-page">
          <div class="story-text">
            <h2 class="chapter-title">Capítulo {{ currentPageIndex + 1 }}</h2>
            <p>{{ currentPage.text }}</p>
          </div>
        </div>
      </div>
  
      <!-- Botones navegación en escritorio -->
      <div v-if="!isMobile" class="nav-buttons">
        <button
          class="nav-button"
          @click="prevPage"
          :disabled="currentPageIndex === 0"
        >
          ← Anterior
        </button>
        <button
          class="nav-button"
          @click="nextPage"
          :disabled="currentPageIndex === pages.length - 1"
        >
          Siguiente →
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  
  const pages = [
  {
    title: "Capítulo 1: Goles con rugido",
    image: "/imagenes/cuentos/deportes/cap-1.png",
    text: `Coco estaba triste porque no alcanzaba la pelota.
—¡No importa el tamaño, sino la garra! —rugió el león.
Con ánimo y práctica, Coco logró marcar un gol con la cola.
—¡Gooooool! —gritaron todos.`,
  },
  {
    title: "Capítulo 2: Coco y el salto ardilla",
    image: "/imagenes/cuentos/deportes/cap-2.png",
    text: `La ardilla botaba el balón a toda velocidad.
—¡Vamos, Coco! ¡Salta como yo!
Coco lo intentó… ¡y encestó con la oreja!
—¡Eres un crack peludo! —dijo la ardilla riendo`,
  },
  {
    title: "Capítulo 3: Golpes con tentáculos",
    image: "/imagenes/cuentos/deportes/cap-3.png",
    text: `—¡El truco es esquivar bailando! —explicó el pulpo.
Coco se puso los guantes y giró sobre sus patitas.
Un golpe, otro… ¡y una voltereta final!
—¡Wow, Coco, tienes estilo! —aplaudió el pulpo.`,
  },
  {
    title: "Capítulo 4: Raquetas y paciencia",
    image: "/imagenes/cuentos/deportes/cap-4.png",
    text: `—El tenis es como meditar —dijo la tortuga con calma.
Coco quería correr, pero aprendió a esperar el momento.
Con un toque suave… ¡punto para Coco!
—A veces ir despacio es la clave —dijo su amiga.`,
  },
  {
    title: "Capítulo 5: Motozumbidos",
    image: "/imagenes/cuentos/deportes/cap-5.png",
    text: `Zuuum… ¡la abeja volaba con su moto mini!
—¡Vamos, Coco, sigue la curva con ritmo!
Coco aceleró, giró… ¡y voló (casi) como una abeja!
—¡Guau! ¡Ahora tienes alas, Coco!`,
  },
  
];
  
  const currentPageIndex = ref(0);
  
  const currentPage = computed(() => pages[currentPageIndex.value]);
  
  // Navegación
  const nextPage = () => {
    if (currentPageIndex.value < pages.length - 1) currentPageIndex.value++;
  };
  
  const prevPage = () => {
    if (currentPageIndex.value > 0) currentPageIndex.value--;
  };
  
  // Detectar si es móvil
  const isMobile = ref(false);
  
  onMounted(() => {
    isMobile.value = window.innerWidth <= 768;
  });
  
  // Gestos para móvil
  let xStart = 0;
  
  const startTouch = (e) => {
    xStart = e.changedTouches[0].clientX;
  };
  
  const endTouch = (e) => {
    const xEnd = e.changedTouches[0].clientX;
    const deltaX = xStart - xEnd;
  
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) nextPage();
      else prevPage();
    }
  };
  </script>
  
  <style scoped>
  .storybook {
    max-width: 800px; /* bajamos de 1000 a 800 */
    margin: 2rem auto;
    background: linear-gradient(to bottom right, #d6e4f0, #e8ecf9);
    border: 5px double #6c88b0;
    border-radius: 20px;
    box-shadow: 0 15px 40px rgba(33, 60, 96, 0.3);
    padding: 1rem;
    font-family: "Georgia", serif;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;
  }
  
  .book-container {
    display: flex;
    flex-direction: row;
  }
  
  .page {
    flex: 1;
    padding: 1.5rem;
    min-height: 400px;
    background: #f0f6ff;
    border: 2px solid #a8c3e5;
    margin: 0.5rem;
    box-shadow: inset 0 0 10px rgba(80, 120, 180, 0.1);
    border-radius: 12px;
  }
  
  .left-page img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(30, 60, 100, 0.2);
  }
  
  .right-page .story-text {
    font-size: 1.1rem;
    line-height: 1.7;
    text-align: justify;
    text-indent: 1.5rem;
    padding-right: 0.5rem;
    color: #2c3e50;
  }
  
  .chapter-title {
    font-family: "Caveat", cursive;
    font-size: 1.8rem;
    color: #486b9f;
    margin-bottom: 1rem;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(150, 180, 255, 0.5);
  }
  
  .nav-buttons {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
  }
  
  .nav-button {
    background: #c3d4f6;
    border: 2px solid #6c88b0;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.3s ease;
    color: #2e3d5c;
  }
  
  .nav-button:hover {
    background: #a9c0ea;
  }
  
  @media (max-width: 768px) {
    .book-container {
      flex-direction: column;
    }
  
    .page {
      margin: 0.5rem auto;
      width: 100%;
    }
  
    .left-page,
    .right-page {
      min-height: 300px;
    }
  }
  </style>
  