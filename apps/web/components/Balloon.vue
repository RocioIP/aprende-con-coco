<template>
  <div
    v-if="visible"
    class="balloon d-flex justify-content-center align-items-center"
    :class="[ sizeClass, { shake: isShaking } ]"
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
  targetSize: { type: String, default: null }, // 'grande' | 'pequeno' | null (solo para nivel 2)
  size: { type: String, default: 'grande' },   // 'grande' | 'pequeno'
})

const emit = defineEmits(['correct', 'wrong'])

const visible = ref(true)
const isShaking = ref(false)

let popSound, errorSound

// Medidas base
const BASE_W = 100
const BASE_H = 120

onMounted(() => {
  popSound = new Audio('/sounds/pop.mp3')
  errorSound = new Audio('/sounds/error.mp3')
})

const sizeClass = computed(() => (props.size === 'pequeno' ? 'small' : 'big'))

const handleClick = () => {
  const isLevel2 = !!props.targetSize
  const isRightColor = props.color === props.targetColor
  const isRightSize = !isLevel2 || props.size === props.targetSize

  if (isRightColor && isRightSize) {
    popSound?.play()
    const dims = getDims()
    const centerX = props.x + dims.w / 2
    const centerY = props.y + dims.h / 2
    // No ocultamos aquí; dejamos que el padre gestione la eliminación
    emit('correct', { x: centerX, y: centerY, color: props.color, size: props.size })
  } else {
    errorSound?.play()
    isShaking.value = true
    emit('wrong')
    setTimeout(() => { isShaking.value = false }, 500)
  }
}

function getDims() {
  if (props.size === 'pequeno') return { w: Math.round(BASE_W * 0.75), h: Math.round(BASE_H * 0.75) }
  return { w: BASE_W, h: BASE_H }
}

const balloonStyle = computed(() => {
  const { w, h } = getDims()
  return {
    top: props.y + 'px',
    left: props.x + 'px',
    width: w + 'px',
    height: h + 'px',
    backgroundColor: props.color,
  }
})
</script>

<style scoped>
.balloon {
  position: absolute;
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
  line-height: 90px; /* se ajusta visualmente; con height menor se centra por flex */
  pointer-events: none;
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

/* Tamaños */
.big { transform-origin: center bottom; }
.small { transform-origin: center bottom; }

.shake { animation: shake 0.3s; }

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
