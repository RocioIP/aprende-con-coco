<template>
  <div>
    <div v-if="!cuentoSeleccionado" class="seleccion-cuentos">
      <div class="lista-cuentos">
        <div class="cuadro-cuento" @click="abrirCuento('cuento1')">
          <img src="/images/stories/barco/portada.png" alt="História do Barco" />
          <h2>O Barco Encantado</h2>
        </div>
        <div class="cuadro-cuento" @click="abrirCuento('cuento2')">
          <img src="/images/stories/luna/portada.png" alt="História da Lua" />
          <h2>Coco e a Sua Viagem à Lua</h2>
        </div>
        <!-- <div class="cuadro-cuento" @click="abrirCuento('cuento3')">
          <img src="/images/stories/deportes/portada.png" alt="História Desportiva" />
          <h2>Coco Fica em Forma</h2>
        </div> -->
      </div>
    </div>

    <div v-else>
      <CuentoUno v-if="cuentoSeleccionado === 'cuento1'" />
      <CuentoDos v-if="cuentoSeleccionado === 'cuento2'" />
      <CuentoTres v-if="cuentoSeleccionado === 'cuento3'" />
      <button class="volver" @click="cuentoSeleccionado = null">
        ← Voltar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import CuentoUno from "@/pages/stories/BoatStory.vue";
import CuentoDos from "@/pages/stories/MoonStory.vue";
import CuentoTres from "@/pages/stories/SportsStory.vue";

const cuentoSeleccionado = ref(null);

const abrirCuento = (id) => {
  cuentoSeleccionado.value = id;
};
</script>

<style scoped>
.titulo {
  text-align: center;
  margin: 2rem 0;
  color: #2c3e50;
}

.lista-cuentos {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
}

.cuadro-cuento {
  width: 350px;
  cursor: pointer;
  text-align: center;
  background: #e8ecf9;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.cuadro-cuento:hover {
  transform: scale(1.05);
}

.cuadro-cuento img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.volver {
  margin: 1rem auto;
  display: block;
  padding: 0.6rem 1.2rem;
  border: none;
  background: #a9c0ea;
  color: #2e3d5c;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.volver:hover {
  background: #6c88b0;
  color: white;
}
</style>
