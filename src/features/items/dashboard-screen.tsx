import { Bot, Box, Plus, Settings } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CategoryFilters } from '@/features/items/category-filters'
import { DashboardCoverItem } from '@/features/items/dashboard-cover-item'
import { DashboardDisplayPreferenceControl } from '@/features/items/dashboard-display-preference-control'
import { useDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import {
  groupActiveDashboardItemsByStatus,
  groupOrderedDashboardItemsByCategorySections,
  orderActiveDashboardItems,
} from '@/features/items/dashboard-item-ordering'
import type { DashboardItemInteractionProps } from '@/features/items/dashboard-item-interactions'
import { DashboardListItem } from '@/features/items/dashboard-list-item'
import { InterestCard } from '@/features/items/interest-card'
import { filterItemsBySearchQuery } from '@/features/items/item-search'
import { listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import { getNextStatus } from '@/features/items/status-flow'
import type { Category, InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type CategoryFilterValue = Category | 'all'

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
  const [dashboardDisplayPreference, setDashboardDisplayPreference] = useDashboardDisplayPreference()

  useEffect(() => {
    repositoryRef.current = repository
  }, [repository])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadItems() {
      const nextItems = await repositoryRef.current.listItems()

      if (isMounted) {
        setItems(orderActiveDashboardItems(nextItems))
        setIsLoading(false)
      }
    }

    void loadItems()

    return () => {
      isMounted = false
    }
  }, [reloadKey, repository])

  const categories = useMemo(() => listCategoryMetadata(locale), [locale])

  const activeItems = items

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

  const categoryMetadataByKey = useMemo(
    () => new Map(categories.map((category) => [category.key, category])),
    [categories],
  )

  const groupedFilteredItems = useMemo(
    () => groupOrderedDashboardItemsByCategorySections(filteredItems),
    [filteredItems],
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

    setItems((currentItems) => {
      const nextItems = updatedItem.status === 'completed'
        ? currentItems.filter((currentItem) => currentItem.id !== updatedItem.id)
        : currentItems.map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem))

      return groupActiveDashboardItemsByStatus(nextItems)
    })
  }

  function getDashboardItemInteractionProps(
    item: InterestItem,
    metadata: DashboardItemInteractionProps['metadata'],
  ): DashboardItemInteractionProps {
    return {
      item,
      metadata,
      onAdvance: handleAdvanceStatus,
      onEdit: onEditItem ? () => onEditItem(item.id) : undefined,
      cancelLabel: t('addFlow.cancel'),
      closeLabel: t('app.closeLabel'),
      completeWarningLabel: t('dashboard.completeWarning'),
      editHref: `/dashboard/edit/${item.id}`,
      editLabel: t('dashboard.editAction'),
      startLabel: t('dashboard.startAction'),
    }
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
      titleActions={(
        <DashboardDisplayPreferenceControl
          name={'dashboard-display-preference-header'}
          onChange={setDashboardDisplayPreference}
          value={dashboardDisplayPreference}
          variant={'icon'}
        />
      )}
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

        {!isLoading && filteredItems.length > 0 && dashboardDisplayPreference === 'cards' ? (
          <div className={'grid gap-4 md:grid-cols-2 2xl:grid-cols-3'} data-testid={'dashboard-cards-grid'}>
            {filteredItems.map((item) => {
              const metadata = categoryMetadataByKey.get(item.category)

              if (!metadata) {
                return null
              }

              return (
                <InterestCard
                  key={item.id}
                  {...getDashboardItemInteractionProps(item, metadata)}
                />
              )
            })}
          </div>
        ) : null}

        {!isLoading && filteredItems.length > 0 && dashboardDisplayPreference === 'list' ? (
          <div className={'space-y-8'} data-testid={'dashboard-list'}>
            {groupedFilteredItems.map(({ key, category, items: categoryItems }) => {
              const metadata = categoryMetadataByKey.get(category)

              if (!metadata) {
                return null
              }

              return (
                <section className={'space-y-3'} key={key}>
                  <h2 className={cn('text-xl font-semibold tracking-tight', metadata.textClassName)}>{metadata.label}</h2>
                  <div className={'grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3'}>
                    {categoryItems.map((item) => (
                      <DashboardListItem
                        key={item.id}
                        {...getDashboardItemInteractionProps(item, metadata)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}

        {!isLoading && filteredItems.length > 0 && dashboardDisplayPreference === 'covers' ? (
          <div className={'columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4'} data-testid={'dashboard-covers-grid'}>
            {filteredItems.map((item) => {
              const metadata = categoryMetadataByKey.get(item.category)

              if (!metadata) {
                return null
              }

              return (
                <DashboardCoverItem
                  key={item.id}
                  {...getDashboardItemInteractionProps(item, metadata)}
                />
              )
            })}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
