import { resolveInterestCoverMetadata, type InterestCoverResolver } from '@/features/items/cover-metadata'
import type { Category, CreateInterestItemInput, InterestItem, InterestItemCoverMetadata, InterestRepository } from '@/features/items/types'

const STARTER_COVER_LOOKUP_TIMEOUT_MS = 3500

type StarterPackItem = {
  category: Extract<Category, 'series' | 'movies' | 'books'>
  title: string
}

function getStarterPackItemKey(item: Pick<InterestItem, 'category' | 'title'>) {
  return `${item.category}:${item.title.trim().toLocaleLowerCase()}`
}

export const starterPackItems = [
  { category: 'series', title: 'Midnight Diner / Shinya Shokudō' },
  { category: 'series', title: 'First Love' },
  { category: 'series', title: 'Alice in Borderland' },
  { category: 'series', title: 'The Makanai: Cooking for the Maiko House' },
  { category: 'series', title: 'Samurai Gourmet' },
  { category: 'series', title: 'House of Ninjas' },
  { category: 'series', title: 'Gannibal' },
  { category: 'series', title: 'VIVANT' },
  { category: 'series', title: 'Unnatural' },
  { category: 'series', title: 'Quartet' },
  { category: 'series', title: 'Sanctuary' },
  { category: 'series', title: 'The Naked Director' },
  { category: 'movies', title: 'Los siete samuráis' },
  { category: 'movies', title: 'El viaje de Chihiro' },
  { category: 'movies', title: 'Tokyo Story / Cuentos de Tokio' },
  { category: 'movies', title: 'Rashomon' },
  { category: 'movies', title: 'Harakiri' },
  { category: 'movies', title: 'Shoplifters' },
  { category: 'movies', title: 'Drive My Car' },
  { category: 'movies', title: 'Godzilla Minus One' },
  { category: 'movies', title: 'Tampopo' },
  { category: 'movies', title: 'Your Name / Kimi no Na wa' },
  { category: 'movies', title: 'Perfect Days' },
  { category: 'books', title: 'Kokoro' },
  { category: 'books', title: 'País de nieve' },
  { category: 'books', title: 'Indigno de ser humano' },
  { category: 'books', title: 'La mujer de la arena' },
  { category: 'books', title: 'Las hermanas Makioka' },
  { category: 'books', title: 'El elogio de la sombra' },
  { category: 'books', title: 'Out' },
  { category: 'books', title: 'La dependienta' },
  { category: 'books', title: 'La policía de la memoria' },
  { category: 'books', title: 'Kafka en la orilla' },
] satisfies StarterPackItem[]

export const defaultStarterPackCoverResolver: InterestCoverResolver = (input) => resolveInterestCoverMetadata(input)

async function resolveStarterPackCoverMetadata(
  item: StarterPackItem,
  coverResolver: InterestCoverResolver,
): Promise<InterestItemCoverMetadata> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, STARTER_COVER_LOOKUP_TIMEOUT_MS)

  try {
    return await coverResolver({
      category: item.category,
      signal: controller.signal,
      title: item.title,
    }) ?? {}
  }
  catch {
    return {}
  }
  finally {
    window.clearTimeout(timeoutId)
  }
}

export async function createStarterPackItems(
  repository: InterestRepository,
  coverResolver: InterestCoverResolver = defaultStarterPackCoverResolver,
): Promise<InterestItem[]> {
  const existingItemKeys = new Set((await repository.listItems()).map(getStarterPackItemKey))
  const missingStarterItems = starterPackItems.filter((item) => !existingItemKeys.has(getStarterPackItemKey(item)))
  const starterItemInputs = await Promise.all(missingStarterItems.map(async (item): Promise<CreateInterestItemInput> => ({
    category: item.category,
    title: item.title,
    ...await resolveStarterPackCoverMetadata(item, coverResolver),
  })))
  const createdItems: InterestItem[] = []

  for (const starterItemInput of starterItemInputs) {
    const createdItem = await repository.createItem(starterItemInput)

    createdItems.push(createdItem)
  }

  return createdItems
}
