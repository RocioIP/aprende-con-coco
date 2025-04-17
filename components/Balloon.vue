<template>
  <div
    v-if="visible"
    class="balloon d-flex justify-content-center align-items-center"
    :class="{ shake: isShaking }"
    @click="handleClick"
    @touchstart="handleClick"
    :style="balloonStyle"
  >
    <span class="balloon-text">{{ letter }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  x: Number,
  y: Number,
  color: String,
  letter: String,
  targetColor: String,
})

const emit = defineEmits(['correct', 'wrong'])

const visible = ref(true)
const isShaking = ref(false)
const popSound = new Audio('/sounds/pop.mp3')
const errorSound = new Audio('/sounds/error.mp3')

const handleClick = () => {
  if (props.color === props.targetColor) {
    popSound.play()
    visible.value = false
    emit('correct')
  } else {
    errorSound.play()
    isShaking.value = true
    emit('wrong')
    setTimeout(() => {
      isShaking.value = false
    }, 500)
  }
}

const balloonStyle = computed(() => ({
  top: props.y + 'px',
  left: props.x + 'px',
  backgroundColor: props.color,
}))
</script>

<style scoped>
.balloon {
  position: absolute;
  width: 80px;
  height: 100px;
  border-radius: 50% 50% 50% 50%;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  font-size: 2rem;
  color: white;
  text-align: center;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 1;
  animation: float 4s ease-in-out infinite;
}

.balloon-text {
  line-height: 90px;
}

.balloon::after {
  content: "";
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 30px;
  background-color: #444;
  z-index: 0;
}

.balloon::before {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 6px;
  background-color: inherit;
  border-radius: 2px;
  z-index: 2;
}

/* Animación de sacudida */
.shake {
  animation: shake 0.3s;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

/* Animación de flotación */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
