export type BlackboardActivity = 'free' | 'numbers' | 'figures'

export type TraceActivityStatus = 'tracing' | 'completed' | 'finished'

export type BlackboardFigureId =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'star'
  | 'heart'

export interface BlackboardColorOption {
  id: string
  labelKey: string
  value: string
}

export interface BlackboardActivityOption {
  icon: string
  id: BlackboardActivity
  labelKey: string
}

export interface CanvasSize {
  height: number
  width: number
}

export interface TracePoint {
  x: number
  y: number
}
