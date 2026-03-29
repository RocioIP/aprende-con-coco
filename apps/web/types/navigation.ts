export type NavigationTone = 'warning' | 'primary' | 'danger'

export interface NavigationItem {
  id: 'games' | 'stories' | 'blackboard'
  to: string
  labelKey: string
  tone: NavigationTone
}
