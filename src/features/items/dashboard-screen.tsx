import { Bot, Box, Plus, Settings } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CategoryFilters } from '@/features/items/category-filters'
import { InterestCard } from '@/features/items/interest-card'
import { filterItemsBySearchQuery } from '@/features/items/item-search'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import { getNextStatus } from '@/features/items/status-flow'
import type { Category, InterestItem, InterestRepository, ItemStatus } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'

type CategoryFilterValue = Category | 'all'

const activeDashboardStatuses = new Set<ItemStatus>(['pending', 'in_progress'])

type DashboardScreenProps = {
  reloadKey?: string | number
  repository?: InterestRepository
  onAddItem?: () => void
  onEditItem?: (itemId: string) => void
  onSuggestItem?: () => void
}

export function DashboardScreen({
  reloadKey,
  repository = getAppInterestRepository(),
  onAddItem,
  onEditItem,
  onSuggestItem,
}: DashboardScreenProps) {
  const { locale, t } = useLocale()
  const addActionLabel = t('dashboard.addAction')
  const suggestActionLabel = t('dashboard.suggestAction')
  const archiveActionLabel = t('dashboard.archiveAction')
  const settingsActionLabel = t('dashboard.settingsAction')
  const repositoryRef = useRef<InterestRepository>(repository)
  const [items, setItems] = useState<InterestItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    repositoryRef.current = repository
  }, [repository])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadItems() {
      const nextItems = await repositoryRef.current.listItems()

      if (isMounted) {
        setItems(nextItems)
        setIsLoading(false)
      }
    }

    void loadItems()

    return () => {
      isMounted = false
    }
  }, [reloadKey, repository])

  const categories = useMemo(() => listCategoryMetadata(locale), [locale])

  const activeItems = useMemo(
    () => items.filter((item) => activeDashboardStatuses.has(item.status)),
    [items],
  )

  const categoriesWithCounts = useMemo(
    () => categories.map((category) => ({
      ...category,
      count: activeItems.filter((item) => item.category === category.key).length,
    })),
    [activeItems, categories],
  )

  const filteredItems = useMemo(
    () => filterItemsBySearchQuery(
      activeItems.filter((item) => selectedCategory === 'all' || item.category === selectedCategory),
      searchQuery,
    ),
    [activeItems, searchQuery, selectedCategory],
  )

  const hasSearchQuery = searchQuery.trim().length > 0

  async function handleAdvanceStatus(item: InterestItem) {
    const nextStatus = getNextStatus(item.status)

    if (!nextStatus) {
      return
    }

    const updatedItem = await repositoryRef.current?.updateStatus(item.id, nextStatus)

    if (!updatedItem) {
      return
    }

    setItems((currentItems) => (
      updatedItem.status === 'completed'
        ? currentItems.filter((currentItem) => currentItem.id !== updatedItem.id)
        : currentItems.map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem))
    ))
  }

  return (
    <AppShell
      actions={(
        <div className={'flex flex-wrap items-center justify-end gap-3'}>
          <Button asChild size={'icon'} variant={'outline'}>
            <a href={'/dashboard/archive'} title={archiveActionLabel}>
              <Box aria-hidden={'true'} />
              <span className={'sr-only'}>{archiveActionLabel}</span>
            </a>
          </Button>
          <Button asChild size={'icon'} variant={'outline'}>
            <a href={'/dashboard/settings'} title={settingsActionLabel}>
              <Settings aria-hidden={'true'} />
              <span className={'sr-only'}>{settingsActionLabel}</span>
            </a>
          </Button>
          {onSuggestItem ? (
            <Button onClick={onSuggestItem} size={'icon'} type={'button'} variant={'secondary'}>
              <Bot aria-hidden={'true'} />
              <span className={'sr-only'}>{suggestActionLabel}</span>
            </Button>
          ) : (
            <Button asChild size={'icon'} variant={'secondary'}>
              <a href={'/dashboard/suggest'} title={suggestActionLabel}>
                <Bot aria-hidden={'true'} />
                <span className={'sr-only'}>{suggestActionLabel}</span>
              </a>
            </Button>
          )}
          {onAddItem ? (
            <Button className={'[&_svg]:size-6'} onClick={onAddItem} size={'icon'} type={'button'}>
              <Plus aria-hidden={'true'} className={'size-6'} />
              <span className={'sr-only'}>{addActionLabel}</span>
            </Button>
          ) : (
            <Button asChild className={'[&_svg]:size-6'} size={'icon'}>
              <a href={'/dashboard/add'} title={addActionLabel}>
                <Plus aria-hidden={'true'} className={'size-6'} />
                <span className={'sr-only'}>{addActionLabel}</span>
              </a>
            </Button>
          )}
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={t('dashboard.title')}
    >
      <div className={'space-y-6'}>
        <div className={'flex flex-col gap-4 lg:flex-row lg:items-end'}>
          <div className={'min-w-0 flex-1'}>
            <CategoryFilters
              allLabel={t('dashboard.allCategories')}
              categories={categoriesWithCounts}
              className={'lg:min-w-max lg:flex-nowrap'}
              containerClassName={'lg:overflow-x-auto lg:overflow-y-hidden'}
              label={t('dashboard.filtersLabel')}
              onValueChange={setSelectedCategory}
              totalCount={activeItems.length}
              value={selectedCategory}
            />
          </div>

          <div className={'w-full lg:w-80 lg:max-w-sm lg:shrink-0'}>
            <Input
              aria-label={t('dashboard.searchLabel')}
              className={'w-full'}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              type={'search'}
              value={searchQuery}
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.loading')}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{hasSearchQuery ? t('dashboard.emptySearchTitle') : t('dashboard.emptyTitle')}</CardTitle>
              <CardDescription>{hasSearchQuery ? t('dashboard.emptySearchDescription') : t('dashboard.emptyDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && filteredItems.length > 0 ? (
          <div className={'grid gap-4 md:grid-cols-2 2xl:grid-cols-3'}>
            {filteredItems.map((item) => (
              <InterestCard
                item={item}
                key={item.id}
                metadata={getCategoryMetadata(item.category, locale)}
                onAdvance={handleAdvanceStatus}
                onEdit={onEditItem ? () => onEditItem(item.id) : undefined}
                cancelLabel={t('addFlow.cancel')}
                closeLabel={t('app.closeLabel')}
                completeWarningLabel={t('dashboard.completeWarning')}
                editHref={`/dashboard/edit/${item.id}`}
                editLabel={t('dashboard.editAction')}
                startLabel={t('dashboard.startAction')}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
