import confetti from 'canvas-confetti'

export interface ScreenPoint {
  x: number
  y: number
}

interface ConfettiOptions {
  gravity?: number
  particleCount?: number
  spread?: number
  startVelocity?: number
  ticks?: number
}

function canUseWindow() {
  return import.meta.client && typeof window !== 'undefined'
}

export function launchCenteredConfetti(options: ConfettiOptions = {}) {
  if (!canUseWindow()) return

  confetti({
    gravity: 0.9,
    origin: { x: 0.5, y: 0.5 },
    ...options,
  })
}

export function launchPointConfetti(point: ScreenPoint, options: ConfettiOptions = {}) {
  if (!canUseWindow()) return

  confetti({
    gravity: 0.9,
    origin: {
      x: point.x / window.innerWidth,
      y: point.y / window.innerHeight,
    },
    ...options,
  })
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (!canUseWindow()) {
      resolve()
      return
    }

    window.setTimeout(resolve, ms)
  })
}
