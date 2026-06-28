import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { LanguageToggle } from '@/components/app/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryFilters } from '@/features/items/category-filters'
import { InterestCard } from '@/features/items/interest-card'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import { getNextStatus } from '@/features/items/status-flow'
import type { Category, InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'

type CategoryFilterValue = Category | 'all'

type DashboardScreenProps = {
  reloadKey?: string
  repository?: InterestRepository
}

export function DashboardScreen({ reloadKey, repository = getAppInterestRepository() }: DashboardScreenProps) {
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

  const filteredItems = useMemo(
    () =>
      selectedCategory === 'all'
        ? items
        : items.filter((item) => item.category === selectedCategory),
    [items, selectedCategory],
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

    setItems((currentItems) =>
      currentItems.map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem)),
    )
  }

  return (
    <AppShell
      actions={(
        <div className={'flex flex-wrap items-center gap-3'}>
          <Button asChild>
            <a href={'/dashboard/add'}>{t('dashboard.addAction')}</a>
          </Button>
          <Button asChild variant={'secondary'}>
            <a href={'/dashboard/suggest'}>{t('dashboard.suggestAction')}</a>
          </Button>
          <Button asChild variant={'outline'}>
            <a href={'/dashboard/archive'}>{t('dashboard.archiveAction')}</a>
          </Button>
          <LanguageToggle />
        </div>
      )}
      description={t('dashboard.subtitle')}
      eyebrow={t('dashboard.eyebrow')}
      title={t('dashboard.title')}
    >
      <div className={'space-y-6'}>
        <div className={'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'}>
          <CategoryFilters
            allLabel={t('dashboard.allCategories')}
            categories={categories}
            label={t('dashboard.filtersLabel')}
            onValueChange={setSelectedCategory}
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
                locale={locale}
                metadata={getCategoryMetadata(item.category, locale)}
                onAdvance={handleAdvanceStatus}
                startLabel={t('dashboard.startAction')}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
