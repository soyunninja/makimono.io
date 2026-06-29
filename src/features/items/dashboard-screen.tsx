import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryFilters } from '@/features/items/category-filters'
import { InterestCard } from '@/features/items/interest-card'
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
  const repositoryRef = useRef<InterestRepository>(repository)
  const [items, setItems] = useState<InterestItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>('all')
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
    () =>
      activeItems.filter((item) => selectedCategory === 'all' || item.category === selectedCategory),
    [activeItems, selectedCategory],
  )

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
          {onAddItem ? (
            <Button onClick={onAddItem} type={'button'}>
              {t('dashboard.addAction')}
            </Button>
          ) : (
            <Button asChild>
              <a href={'/dashboard/add'}>{t('dashboard.addAction')}</a>
            </Button>
          )}
          {onSuggestItem ? (
            <Button onClick={onSuggestItem} type={'button'} variant={'secondary'}>
              {t('dashboard.suggestAction')}
            </Button>
          ) : (
            <Button asChild variant={'secondary'}>
              <a href={'/dashboard/suggest'}>{t('dashboard.suggestAction')}</a>
            </Button>
          )}
          <Button asChild variant={'outline'}>
            <a href={'/dashboard/archive'}>{t('dashboard.archiveAction')}</a>
          </Button>
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={t('dashboard.title')}
    >
      <div className={'space-y-6'}>
        <div className={'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'}>
          <CategoryFilters
            allLabel={t('dashboard.allCategories')}
            categories={categoriesWithCounts}
            label={t('dashboard.filtersLabel')}
            onValueChange={setSelectedCategory}
            totalCount={activeItems.length}
            value={selectedCategory}
          />
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
              <CardTitle>{t('dashboard.emptyTitle')}</CardTitle>
              <CardDescription>{t('dashboard.emptyDescription')}</CardDescription>
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
