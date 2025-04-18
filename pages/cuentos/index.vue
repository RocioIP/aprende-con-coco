<template>
  <div>
    <div v-if="!cuentoSeleccionado" class="seleccion-cuentos">
      <!-- <h1 class="titulo">Elige un cuento</h1> -->
      <div class="lista-cuentos">
        <div class="cuadro-cuento" @click="abrirCuento('cuento1')">
          <img src="/images/stories/barco/portada.png" alt="Cuento Barco" />
          <h2>El Barco encantado</h2>
        </div>
        <div class="cuadro-cuento" @click="abrirCuento('cuento2')">
          <img src="/images/stories/luna/portada.png" alt="Cuento Luna" />
          <h2>Coco y su viaje a la Luna</h2>
        </div>
        <!-- <div class="cuadro-cuento" @click="abrirCuento('cuento3')">
          <img src="/images/stories/deportes/portada.png" alt="Cuento Luna" />
          <h2>Coco se pone en forma</h2>
        </div> -->
        <!-- Agregás más cuentos aquí si querés -->
      </div>
    </div>

    <div v-else>
      <CuentoUno v-if="cuentoSeleccionado === 'cuento1'" />
      <CuentoDos v-if="cuentoSeleccionado === 'cuento2'" />
      <CuentoTres v-if="cuentoSeleccionado === 'cuento3'" />
      <button class="volver" @click="cuentoSeleccionado = null">
        ← Volver
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import CuentoUno from "@/pages/cuentos/cuento-barco.vue";
import CuentoDos from "@/pages/cuentos/cuento-luna.vue";
import CuentoTres from "@/pages/cuentos/cuento-deportes.vue";

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
