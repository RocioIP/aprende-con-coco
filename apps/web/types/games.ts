export interface GameCatalogItem {
  id: 'balloons' | 'letters' | 'animalSound' | 'numbersCards'
  to: string
  image: string
  titleKey: string
  descriptionKey: string
  altKey: string
}

export interface GameCardViewModel {
  id: string
  to: string
  image: string
  title: string
  description: string
  alt: string
}
