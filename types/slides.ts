export interface Slide {
  id: number
  content: string
}

export interface ModuleContent {
  id: string
  title: string
  slides: Slide[]
}

