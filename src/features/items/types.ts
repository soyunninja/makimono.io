export const itemCategories = ['series', 'movies', 'games', 'books', 'music'] as const

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
  deletedAt?: string
}

export type CreateInterestItemInput = {
  category: Category
  title: string
  notes?: string
  tags?: string[]
}

export type ListInterestItemsOptions = {
  includeDeleted?: boolean
}

export type UpdateInterestItemInput = Partial<Pick<InterestItem, 'category' | 'title' | 'notes' | 'tags'>>

export type InterestRepository = {
  listItems: (options?: ListInterestItemsOptions) => Promise<InterestItem[]>
  createItem: (input: CreateInterestItemInput) => Promise<InterestItem>
  updateItem: (id: string, input: UpdateInterestItemInput) => Promise<InterestItem | null>
  updateStatus: (id: string, status: ItemStatus) => Promise<InterestItem | null>
  deleteItem: (id: string) => Promise<InterestItem | null>
  restoreItem: (id: string) => Promise<InterestItem | null>
}
