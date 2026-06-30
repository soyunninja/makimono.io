import { Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CategoryFilters } from '@/features/items/category-filters'
import type { InterestCoverResolver } from '@/features/items/cover-metadata'
import { DashboardCoverItem } from '@/features/items/dashboard-cover-item'
import { DashboardDisplayPreferenceControl } from '@/features/items/dashboard-display-preference-control'
import { type DashboardDisplayPreference, useDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
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
import { createStarterPackItems, defaultStarterPackCoverResolver } from '@/features/items/starter-pack'
import type { Category, InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type CategoryFilterValue = Category | 'all'

type DashboardScreenProps = {
  reloadKey?: string | number
  repository?: InterestRepository
  coverResolver?: InterestCoverResolver
  onAddItem?: () => void
  onEditItem?: (itemId: string) => void
  onSuggestItem?: () => void
}

const dashboardLogoSources = {
  cards: '/tarjetas.png',
  list: '/listado.png',
  covers: '/caratula.png',
} satisfies Record<DashboardDisplayPreference, string>

const dashboardFaviconSources = {
  cards: '/favicon-tarjetas.png',
  list: '/favicon-listado.png',
  covers: '/favicon-caratulas.png',
} satisfies Record<DashboardDisplayPreference, string>

type DashboardLogoTitleProps = {
  preference: DashboardDisplayPreference
  title: string
}

function DashboardLogoTitle({ preference, title }: DashboardLogoTitleProps) {
  return (
    <span className={'relative block h-11 w-11 sm:h-14 sm:w-14'}>
      <span className={'sr-only'}>{title}</span>
      {Object.entries(dashboardLogoSources).map(([logoPreference, src]) => (
        <img
          alt={''}
          aria-hidden={'true'}
          className={cn(
            'absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-300 ease-in-out',
            preference === logoPreference ? 'opacity-100' : 'opacity-0',
          )}
          key={logoPreference}
          src={src}
        />
      ))}
    </span>
  )
}

export function DashboardScreen({
  reloadKey,
  repository = getAppInterestRepository(),
  coverResolver = defaultStarterPackCoverResolver,
  onAddItem,
  onEditItem,
}: DashboardScreenProps) {
  const { locale, t } = useLocale()
  const addActionLabel = t('dashboard.addAction')
  const repositoryRef = useRef<InterestRepository>(repository)
  const starterPackCreationRef = useRef(false)
  const [items, setItems] = useState<InterestItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingStarterPack, setIsCreatingStarterPack] = useState(false)
  const [starterPackCreationFailed, setStarterPackCreationFailed] = useState(false)
  const [dashboardDisplayPreference, setDashboardDisplayPreference] = useDashboardDisplayPreference()

  useEffect(() => {
    const dynamicFaviconId = 'dashboard-view-favicon'
    const faviconHref = `${dashboardFaviconSources[dashboardDisplayPreference]}?view=${dashboardDisplayPreference}`
    let favicon = document.querySelector<HTMLLinkElement>(`#${dynamicFaviconId}`)

    if (!favicon) {
      favicon = document.createElement('link')
      favicon.id = dynamicFaviconId
      favicon.rel = 'icon'
      favicon.type = 'image/png'
      favicon.sizes = '96x96'
      document.head.appendChild(favicon)
    }

    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((iconLink) => {
      iconLink.href = faviconHref
      iconLink.type = 'image/png'
      iconLink.sizes = '96x96'
    })

    favicon.href = faviconHref
  }, [dashboardDisplayPreference])

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
  const shouldShowStarterPack = !isLoading && activeItems.length === 0 && selectedCategory === 'all' && !hasSearchQuery

  async function handleCreateStarterPack() {
    if (starterPackCreationRef.current) {
      return
    }

    starterPackCreationRef.current = true
    setIsCreatingStarterPack(true)
    setStarterPackCreationFailed(false)

    try {
      const createdItems = await createStarterPackItems(repositoryRef.current, coverResolver)

      setItems((currentItems) => orderActiveDashboardItems([...createdItems, ...currentItems]))
    }
    catch {
      const persistedItems = await repositoryRef.current.listItems()

      setItems(orderActiveDashboardItems(persistedItems))
      setStarterPackCreationFailed(persistedItems.length === 0)
    }
    finally {
      starterPackCreationRef.current = false
      setIsCreatingStarterPack(false)
    }
  }

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
        <div className={'flex flex-nowrap items-center justify-end gap-2 sm:gap-3'}>
          {onAddItem ? (
            <Button className={'size-9 bg-brand-sun text-night hover:bg-brand-sun/90 sm:size-11 [&_svg]:size-5 sm:[&_svg]:size-6'} onClick={onAddItem} size={'icon'} type={'button'}>
              <Plus aria-hidden={'true'} className={'size-5 sm:size-6'} />
              <span className={'sr-only'}>{addActionLabel}</span>
            </Button>
          ) : (
            <Button asChild className={'size-9 bg-brand-sun text-night hover:bg-brand-sun/90 sm:size-11 [&_svg]:size-5 sm:[&_svg]:size-6'} size={'icon'}>
              <a href={'/dashboard/add'} title={addActionLabel}>
                <Plus aria-hidden={'true'} className={'size-5 sm:size-6'} />
                <span className={'sr-only'}>{addActionLabel}</span>
              </a>
            </Button>
          )}
          <DashboardOverflowMenu currentView={'dashboard'} />
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={<DashboardLogoTitle preference={dashboardDisplayPreference} title={t('dashboard.title')} />}
      titleActions={(
        <DashboardDisplayPreferenceControl
          className={'-ml-1 gap-1 sm:ml-0 sm:gap-2'}
          name={'dashboard-display-preference-header'}
          onChange={setDashboardDisplayPreference}
          value={dashboardDisplayPreference}
          variant={'icon'}
        />
      )}
    >
      <div className={'space-y-6'}>
        <div className={'flex flex-col gap-4 xl:flex-row xl:items-end'}>
          <div className={'min-w-0 flex-1'}>
            <CategoryFilters
              allLabel={t('dashboard.allCategories')}
              categories={categoriesWithCounts}
              className={'xl:min-w-max xl:flex-nowrap'}
              containerClassName={'xl:overflow-x-auto xl:overflow-y-hidden'}
              label={t('dashboard.filtersLabel')}
              onValueChange={setSelectedCategory}
              totalCount={activeItems.length}
              value={selectedCategory}
            />
          </div>

          <div className={'w-full xl:w-80 xl:max-w-sm xl:shrink-0'}>
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

        {shouldShowStarterPack ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.starterTitle')}</CardTitle>
              <CardDescription>{t('dashboard.starterDescription')}</CardDescription>
              {starterPackCreationFailed ? (
                <CardDescription>{t('dashboard.starterError')}</CardDescription>
              ) : null}
            </CardHeader>
            <CardFooter>
              <Button disabled={isCreatingStarterPack} onClick={handleCreateStarterPack} type={'button'}>
                {isCreatingStarterPack ? t('dashboard.starterLoadingAction') : t('dashboard.starterAction')}
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {!isLoading && filteredItems.length === 0 && !shouldShowStarterPack ? (
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
          <div className={'space-y-4 md:space-y-8'} data-testid={'dashboard-list'}>
            {groupedFilteredItems.map(({ key, category, items: categoryItems }) => {
              const metadata = categoryMetadataByKey.get(category)

              if (!metadata) {
                return null
              }

              return (
                <section className={'space-y-3'} key={key}>
                  <h2 className={cn('text-xl font-semibold tracking-tight', metadata.textClassName)}>{metadata.label}</h2>
                  <div className={'grid gap-x-6 gap-y-0 md:grid-cols-2 md:gap-y-3 xl:grid-cols-3'}>
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
          <div className={'columns-2 gap-4 lg:columns-3 xl:columns-4'} data-testid={'dashboard-covers-grid'}>
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
