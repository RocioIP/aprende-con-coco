<template>
  <div
    v-if="visible"
    class="balloon d-flex justify-content-center align-items-center"
    :class="{ shake: isShaking }"
    @click="handleClick"
    @touchstart.stop.prevent="handleClick"
    :style="balloonStyle"
  >
    <span class="balloon-text">{{ letter }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  color: { type: String, required: true },
  letter: { type: String, required: true },
  targetColor: { type: String, required: true },
})

const emit = defineEmits(['correct', 'wrong'])

const visible = ref(true)
const isShaking = ref(false)

let popSound, errorSound

// Medidas usadas en el CSS
const BALLOON_W = 100
const BALLOON_H = 120

onMounted(() => {
  popSound = new Audio('/sounds/pop.mp3')
  errorSound = new Audio('/sounds/error.mp3')
})

const handleClick = () => {
  if (props.color === props.targetColor) {
    popSound?.play()
    visible.value = false
    const centerX = props.x + BALLOON_W / 2
    const centerY = props.y + BALLOON_H / 2
    emit('correct', { x: centerX, y: centerY })
  } else {
    errorSound?.play()
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
  width: 100px;
  height: 120px;
  border-radius: 50%;
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

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
