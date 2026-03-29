import type { BlackboardFigureId, CanvasSize, TracePoint } from '@/types/blackboard'

export const FIGURE_IMAGE_BY_ID: Record<BlackboardFigureId, string> = {
  circle: 'bola.webp',
  heart: 'corazon.webp',
  rectangle: 'tv.webp',
  square: 'conto.webp',
  star: 'estrella.webp',
  triangle: 'montana.webp',
}

const DEFAULT_DOT_SPACING = 30

export function sampleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  spacing = DEFAULT_DOT_SPACING
): TracePoint[] {
  const deltaX = x2 - x1
  const deltaY = y2 - y1
  const length = Math.hypot(deltaX, deltaY)
  const steps = Math.max(1, Math.floor(length / spacing))
  const points: TracePoint[] = []

  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps
    points.push({
      x: x1 + deltaX * ratio,
      y: y1 + deltaY * ratio,
    })
  }

  return points
}

export function sampleArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  spacing = DEFAULT_DOT_SPACING
): TracePoint[] {
  const length = Math.abs(endAngle - startAngle) * radius
  const steps = Math.max(1, Math.floor(length / spacing))
  const points: TracePoint[] = []

  for (let index = 0; index <= steps; index += 1) {
    const angle = startAngle + ((endAngle - startAngle) * index) / steps
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }

  return points
}

export function buildFigureTracePoints(
  figureId: BlackboardFigureId,
  size: CanvasSize
): TracePoint[] {
  const centerX = size.width * 0.42
  const centerY = size.height / 2
  const shapeSize = Math.min(size.width, size.height) * 0.18

  const shapes: Record<BlackboardFigureId, TracePoint[]> = {
    circle: Array.from({ length: 24 }, (_, index) => {
      const angle = (index / 24) * Math.PI * 2
      return {
        x: centerX + shapeSize * Math.cos(angle),
        y: centerY + shapeSize * Math.sin(angle),
      }
    }),
    square: [
      ...sampleLine(centerX - shapeSize, centerY - shapeSize, centerX + shapeSize, centerY - shapeSize),
      ...sampleLine(centerX + shapeSize, centerY - shapeSize, centerX + shapeSize, centerY + shapeSize),
      ...sampleLine(centerX + shapeSize, centerY + shapeSize, centerX - shapeSize, centerY + shapeSize),
      ...sampleLine(centerX - shapeSize, centerY + shapeSize, centerX - shapeSize, centerY - shapeSize),
    ],
    rectangle: [
      ...sampleLine(
        centerX - shapeSize,
        centerY - shapeSize / 1.5,
        centerX + shapeSize,
        centerY - shapeSize / 1.5
      ),
      ...sampleLine(
        centerX + shapeSize,
        centerY - shapeSize / 1.5,
        centerX + shapeSize,
        centerY + shapeSize / 1.5
      ),
      ...sampleLine(
        centerX + shapeSize,
        centerY + shapeSize / 1.5,
        centerX - shapeSize,
        centerY + shapeSize / 1.5
      ),
      ...sampleLine(
        centerX - shapeSize,
        centerY + shapeSize / 1.5,
        centerX - shapeSize,
        centerY - shapeSize / 1.5
      ),
    ],
    triangle: [
      ...sampleLine(centerX, centerY - shapeSize, centerX + shapeSize, centerY + shapeSize),
      ...sampleLine(centerX + shapeSize, centerY + shapeSize, centerX - shapeSize, centerY + shapeSize),
      ...sampleLine(centerX - shapeSize, centerY + shapeSize, centerX, centerY - shapeSize),
    ],
    star: (() => {
      const outerRadius = shapeSize
      const innerRadius = shapeSize * 0.55
      const starVertices: TracePoint[] = []

      for (let index = 0; index < 10; index += 1) {
        const radius = index % 2 === 0 ? outerRadius : innerRadius
        const angle = (index * Math.PI) / 5 - Math.PI / 2
        starVertices.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }

      return starVertices.flatMap((point, index) => {
        const nextPoint = starVertices[(index + 1) % starVertices.length]
        return sampleLine(point.x, point.y, nextPoint.x, nextPoint.y)
      })
    })(),
    heart: (() => {
      const points: TracePoint[] = []
      const steps = 28

      for (let index = 0; index <= steps; index += 1) {
        const angle = (index / steps) * Math.PI * 2
        const heartX = 16 * Math.sin(angle) ** 3
        const heartY =
          -(13 * Math.cos(angle) -
            5 * Math.cos(2 * angle) -
            2 * Math.cos(3 * angle) -
            Math.cos(4 * angle))

        points.push({
          x: centerX + (heartX * shapeSize) / 16,
          y: centerY + (heartY * shapeSize) / 13,
        })
      }

      return points
    })(),
  }

  return shapes[figureId]
}

export function buildNumberTracePoints(number: number, size: CanvasSize): TracePoint[] {
  const boxHeight = size.height * 0.65
  const centerX = size.width * 0.38
  const topY = (size.height - boxHeight) / 2

  const smallRadius = 48
  const mediumRadius = 58
  const largeRadius = 68
  const spacing = 28

  const paths: Record<number, TracePoint[]> = {
    1: [
      { x: centerX - 80, y: topY + 65 },
      { x: centerX - 55, y: topY + 40 },
      { x: centerX - 30, y: topY + 20 },
      { x: centerX, y: topY },
      { x: centerX, y: topY + 40 },
      { x: centerX, y: topY + 80 },
      { x: centerX, y: topY + 120 },
      { x: centerX, y: topY + 160 },
      { x: centerX, y: topY + 200 },
      { x: centerX, y: topY + 240 },
    ],
    2: [
      { x: centerX - 60, y: topY + 20 },
      { x: centerX - 30, y: topY },
      { x: centerX, y: topY },
      { x: centerX + 30, y: topY + 20 },
      { x: centerX + 30, y: topY + 70 },
      { x: centerX, y: topY + 100 },
      { x: centerX - 35, y: topY + 130 },
      { x: centerX - 60, y: topY + 160 },
      { x: centerX - 30, y: topY + 160 },
      { x: centerX, y: topY + 160 },
      { x: centerX + 30, y: topY + 160 },
    ],
    3: [
      ...sampleArc(centerX + 18, topY + 60, mediumRadius + 10, -Math.PI / 1.5, Math.PI / 2, spacing),
      ...sampleArc(centerX + 18, topY + 180, mediumRadius + 10, -Math.PI / 2, Math.PI / 1.5, spacing),
    ],
    4: [
      ...sampleLine(centerX - 70, topY + 120, centerX + 70, topY + 120, spacing),
      ...sampleLine(centerX + 70, topY + 10, centerX + 70, topY + 240, spacing),
      ...sampleLine(centerX + 10, topY + 10, centerX - 70, topY + 120, spacing),
    ],
    5: [
      ...sampleLine(centerX + 50, topY + 10, centerX - 50, topY + 10, spacing),
      ...sampleLine(centerX - 50, topY + 10, centerX - 50, topY + 120, spacing),
      ...sampleLine(centerX - 50, topY + 120, centerX + 40, topY + 120, spacing),
      ...sampleArc(centerX + 10, topY + 175, largeRadius, Math.PI, -Math.PI / 6, spacing),
    ],
    6: [
      ...sampleLine(centerX + 50, topY - 30, centerX - 40, topY + 60, spacing),
      ...sampleArc(centerX - 10, topY + 140, largeRadius, -0.3 * Math.PI, 1.7 * Math.PI, spacing),
    ],
    7: [
      ...sampleLine(centerX - 70, topY + 10, centerX + 70, topY + 10, spacing),
      ...sampleLine(centerX + 70, topY + 10, centerX - 10, topY + 240, spacing),
    ],
    8: [
      ...sampleArc(centerX, topY + 80, smallRadius, 0, Math.PI * 2, spacing),
      ...sampleArc(centerX, topY + 180, smallRadius + 10, 0, Math.PI * 2, spacing),
    ],
    9: [
      ...sampleArc(centerX + 10, topY + 80, mediumRadius, 0, Math.PI * 2, spacing),
      ...sampleLine(
        centerX + 30 + mediumRadius * 0.6,
        topY + 60 + mediumRadius * 0.6,
        centerX + 10,
        topY + 240,
        spacing
      ),
    ],
  }

  return paths[number] ?? []
}

interface DrawTraceDotsOptions {
  fillStyle: string
  radius: number
}

export function drawTraceDots(
  context: CanvasRenderingContext2D,
  points: TracePoint[],
  options: DrawTraceDotsOptions
) {
  points.forEach((point) => {
    context.beginPath()
    context.arc(point.x, point.y, options.radius, 0, Math.PI * 2)
    context.fillStyle = options.fillStyle
    context.fill()
  })
}

export function getCanvasEventPoint(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): TracePoint {
  const rect = canvas.getBoundingClientRect()
  const source = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : event

  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top,
  }
}
