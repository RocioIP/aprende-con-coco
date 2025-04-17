<template>
  <header>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-0">
      <NuxtLink class="navbar-brand" to="/">
        <img src="/public/imagenes/aprende-con-coco.png" alt="" class="img-logo">
      </NuxtLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarContent"
        aria-controls="navbarContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div
        class="collapse navbar-collapse justify-content-end"
        id="navbarContent"
      >
        <ul class="navbar-nav">
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/juegos">🎮 Juegos</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/cuentos">📖 Cuentos</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink class="nav-link" to="/pizarra">🎨 Pizarra</NuxtLink>
          </li>
          <!-- <li class="nav-item">
            <NuxtLink class="nav-link" to="/analitica">📊 Analítica</NuxtLink>
          </li> -->
        </ul>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.nav-link {
  font-weight: 500;
  font-size: 1.5rem;
}
.nav-link:hover {
  color: #0d6efd !important;
}

.img-logo {
  width: 6rem;
  height: 6rem;
}
</style>
