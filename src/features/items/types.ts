export const itemCategories = ['series', 'movies', 'games', 'books', 'webs'] as const

export type Category = (typeof itemCategories)[number]

export const itemStatuses = ['pending', 'in_progress', 'completed'] as const

export type ItemStatus = (typeof itemStatuses)[number]

export type InterestItem = {
  id: string
  category: Category
  title: string
  status: ItemStatus
  notes?: string
  tags: string[]
  createdAt: string
}

export type CreateInterestItemInput = {
  category: Category
  title: string
  notes?: string
  tags?: string[]
}

export type InterestRepository = {
  listItems: () => Promise<InterestItem[]>
  createItem: (input: CreateInterestItemInput) => Promise<InterestItem>
  updateStatus: (id: string, status: ItemStatus) => Promise<InterestItem | null>
}
