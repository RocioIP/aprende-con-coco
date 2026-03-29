import type { AppLocale } from '@/lang'

export type StoryId = 'boat' | 'moon'
export type StoryTheme = 'sunrise' | 'starlight'

export interface StoryPage {
  image: string
  imageAlt: string
  title: string
  paragraphs: string[]
}

export interface StoryLocaleContent {
  title: string
  summary: string
  coverAlt: string
  pages: StoryPage[]
}

export interface StoryDefinition {
  id: StoryId
  coverImage: string
  theme: StoryTheme
  content: Record<AppLocale, StoryLocaleContent>
}

export interface LocalizedStory {
  id: StoryId
  coverImage: string
  theme: StoryTheme
  title: string
  summary: string
  coverAlt: string
  pages: StoryPage[]
}
