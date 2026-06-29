import { RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CardCoverBackground } from '@/features/items/card-cover-background'
import { filterItemsBySearchQuery } from '@/features/items/item-search'
import { getCategoryMetadata, listCategoryMetadata, type CategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import type { InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'
import type { Locale } from '@/i18n/types'

import { cn } from '@/lib/utils'

type ArchiveScreenProps = {
  repository?: InterestRepository
}

type ArchiveItemCardProps = {
  item: InterestItem
  locale: Locale
  metadata: CategoryMetadata
  restoreLabel: string
  deletedBadgeLabel: string
  deletedOnLabel: string
  onRestore: (item: InterestItem) => void
}

function formatArchiveDate(date: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}

function ArchiveItemCard({
  item,
  locale,
  metadata,
  restoreLabel,
  deletedBadgeLabel,
  deletedOnLabel,
  onRestore,
}: ArchiveItemCardProps) {
  const isDeleted = item.deletedAt !== undefined
  const restoreControlLabel = `${restoreLabel}: ${item.title}`
  const dateSummary = isDeleted
    ? `${deletedOnLabel} ${formatArchiveDate(item.deletedAt ?? item.createdAt, locale)}`
    : undefined

  return (
    <Card
      className={cn('relative isolate flex h-full flex-col overflow-hidden border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
      key={item.id}
      role={'article'}
    >
      <CardCoverBackground item={item} metadata={metadata} testId="archive-card-cover" />
      <CardContent className={'relative z-10 flex flex-1 items-start !gap-0 p-4 xl:p-6'}>
        <div className={'shrink-0 self-start !-translate-x-2 !-translate-y-2.5'}>
          <Button
            aria-label={restoreControlLabel}
            className={cn('rounded-full border-transparent bg-transparent p-0', metadata.textClassName)}
            onClick={() => void onRestore(item)}
            size={'icon'}
            type={'button'}
            variant={'ghost'}
          >
            <RotateCcw aria-hidden={'true'} className={metadata.textClassName} />
            <span className={'sr-only'}>{restoreControlLabel}</span>
          </Button>
        </div>

        <div className={'flex min-w-0 flex-1 flex-col gap-4'}>
          <div className={'flex flex-wrap items-center justify-between gap-3'}>
            <div className={'flex flex-wrap gap-2'}>
              <Badge className={metadata.accentClassName} variant={'outline'}>
                {metadata.label}
              </Badge>
              <Badge variant={isDeleted ? 'secondary' : 'default'}>
                {metadata.statusLabels[item.status]}
              </Badge>
              {isDeleted ? <Badge variant={'destructive'}>{deletedBadgeLabel}</Badge> : null}
            </div>

            {dateSummary ? <CardDescription className={'text-xs'}>{dateSummary}</CardDescription> : null}
          </div>

          <div className={'min-w-0 space-y-0'}>
            <h3 className={'text-balance break-words text-xl font-semibold tracking-tight text-foreground xl:text-2xl'}>
              {item.title}
            </h3>
            <CardDescription className={item.coverImageUrl ? 'text-foreground/80' : undefined}>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
          </div>

          {item.tags.length > 0 ? (
            <div className={'flex flex-wrap gap-2'}>
              {item.tags.map((tag) => (
                <Badge className={'font-mono font-medium'} key={tag} variant={'outline'}>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ArchiveScreen({ repository = getAppInterestRepository() }: ArchiveScreenProps) {
  const { locale, t } = useLocale()
  const repositoryRef = useRef<InterestRepository>(repository)
  const [items, setItems] = useState<InterestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    repositoryRef.current = repository
  }, [repository])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadItems() {
      const nextItems = await repositoryRef.current.listItems({ includeDeleted: true })

      if (isMounted) {
        setItems(nextItems)
        setIsLoading(false)
      }
    }

    void loadItems()

    return () => {
      isMounted = false
    }
  }, [repository])

  const completedItems = useMemo(
    () => items.filter((item) => item.deletedAt === undefined && item.status === 'completed'),
    [items],
  )

  const deletedItems = useMemo(
    () => items.filter((item) => item.deletedAt !== undefined),
    [items],
  )

  const filteredCompletedItems = useMemo(
    () => filterItemsBySearchQuery(completedItems, searchQuery),
    [completedItems, searchQuery],
  )

  const filteredDeletedItems = useMemo(
    () => filterItemsBySearchQuery(deletedItems, searchQuery),
    [deletedItems, searchQuery],
  )

  const categorySummaries = useMemo(
    () =>
      listCategoryMetadata(locale).map((category) => ({
        category,
        count: completedItems.filter((item) => item.category === category.key).length,
      })),
    [completedItems, locale],
  )

  const hasArchivedItems = completedItems.length > 0 || deletedItems.length > 0
  const hasVisibleArchivedItems = filteredCompletedItems.length > 0 || filteredDeletedItems.length > 0
  const hasSearchQuery = searchQuery.trim().length > 0

  async function handleRestore(item: InterestItem) {
    const updatedItem = item.deletedAt !== undefined
      ? await repositoryRef.current.restoreItem(item.id)
      : await repositoryRef.current.updateStatus(item.id, 'pending')

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
        <div className={'flex flex-wrap items-center justify-end gap-3'}>
          <Button asChild variant={'outline'}>
            <a href={'/dashboard'}>{t('archive.backAction')}</a>
          </Button>
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={t('archive.title')}
    >
      <div className={'space-y-8'}>
        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('archive.loading')}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && !hasArchivedItems ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('archive.emptyTitle')}</CardTitle>
              <CardDescription>{t('archive.emptyDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && completedItems.length > 0 ? (
          <div className={'grid gap-4 md:grid-cols-3 xl:grid-cols-6'}>
            {categorySummaries.map(({ category, count }) => (
              <Card
                aria-label={`${category.label}: ${count}`}
                className={cn('bg-background/40', category.surfaceClassName)}
                key={category.key}
                role={'group'}
              >
                <CardHeader>
                  <CardDescription className={category.textClassName}>{category.label}</CardDescription>
                  <CardTitle className={'text-3xl'}>{count}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        {!isLoading && hasArchivedItems ? (
          <Input
            aria-label={t('archive.searchLabel')}
            className={'w-full'}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('archive.searchPlaceholder')}
            type={'search'}
            value={searchQuery}
          />
        ) : null}

        {!isLoading && hasArchivedItems && !hasVisibleArchivedItems ? (
          <Card>
            <CardHeader>
              <CardTitle>{hasSearchQuery ? t('archive.emptySearchTitle') : t('archive.emptyTitle')}</CardTitle>
              <CardDescription>{hasSearchQuery ? t('archive.emptySearchDescription') : t('archive.emptyDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && filteredCompletedItems.length > 0 ? (
          <section className={'space-y-4'}>
            <div className={'flex flex-wrap items-center gap-3'}>
              <h2 className={'text-2xl font-semibold tracking-tight text-foreground'}>{t('archive.completedSectionTitle')}</h2>
              <Badge variant={'outline'}>{filteredCompletedItems.length}</Badge>
            </div>

            <div className={'grid gap-4 md:grid-cols-2 2xl:grid-cols-3'}>
              {filteredCompletedItems.map((item) => {
                const metadata = getCategoryMetadata(item.category, locale)

                return (
                  <ArchiveItemCard
                    deletedBadgeLabel={t('archive.deletedBadge')}
                    deletedOnLabel={t('archive.deletedOnLabel')}
                    item={item}
                    key={item.id}
                    locale={locale}
                    metadata={metadata}
                    onRestore={handleRestore}
                    restoreLabel={t('archive.restoreAction')}
                  />
                )
              })}
            </div>
          </section>
        ) : null}

        {!isLoading && filteredDeletedItems.length > 0 ? (
          <section className={'space-y-4'}>
            <div className={'flex flex-wrap items-center gap-3'}>
              <h2 className={'text-2xl font-semibold tracking-tight text-foreground'}>{t('archive.deletedSectionTitle')}</h2>
              <Badge variant={'outline'}>{filteredDeletedItems.length}</Badge>
            </div>

            <div className={'grid gap-4 md:grid-cols-2 2xl:grid-cols-3'}>
              {filteredDeletedItems.map((item) => {
                const metadata = getCategoryMetadata(item.category, locale)

                return (
                  <ArchiveItemCard
                    deletedBadgeLabel={t('archive.deletedBadge')}
                    deletedOnLabel={t('archive.deletedOnLabel')}
                    item={item}
                    key={item.id}
                    locale={locale}
                    metadata={metadata}
                    onRestore={handleRestore}
                    restoreLabel={t('archive.restoreAction')}
                  />
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}
