import { RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

function formatCreatedAt(createdAt: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(createdAt))
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
    ? `${formatCreatedAt(item.createdAt, locale)} · ${deletedOnLabel} ${formatCreatedAt(item.deletedAt ?? item.createdAt, locale)}`
    : formatCreatedAt(item.createdAt, locale)

  return (
    <Card
      className={cn('flex h-full flex-col border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
      key={item.id}
      role={'article'}
    >
      <CardContent className={'flex flex-1 flex-col gap-4 p-4 xl:p-6'}>
        <div className={'flex flex-wrap items-start justify-between gap-3'}>
          <div className={'flex flex-wrap gap-2'}>
            <Badge className={metadata.accentClassName} variant={'outline'}>
              {metadata.label}
            </Badge>
            <Badge variant={isDeleted ? 'secondary' : 'default'}>
              {metadata.statusLabels[item.status]}
            </Badge>
            {isDeleted ? <Badge variant={'destructive'}>{deletedBadgeLabel}</Badge> : null}
          </div>

          <Button
            aria-label={restoreControlLabel}
            className={cn('rounded-full border-transparent bg-transparent p-0', metadata.textClassName)}
            onClick={() => void onRestore(item)}
            size={'icon'}
            type={'button'}
            variant={'ghost'}
          >
            <RotateCcw aria-hidden={'true'} />
            <span className={'sr-only'}>{restoreControlLabel}</span>
          </Button>
        </div>

        <div className={'space-y-0'}>
          <h3 className={'text-balance break-words text-xl font-semibold tracking-tight text-foreground xl:text-2xl'}>
            {item.title}
          </h3>
          <CardDescription>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
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

        <CardDescription className={'text-xs'}>{dateSummary}</CardDescription>
      </CardContent>
    </Card>
  )
}

export function ArchiveScreen({ repository = getAppInterestRepository() }: ArchiveScreenProps) {
  const { locale, t } = useLocale()
  const repositoryRef = useRef<InterestRepository>(repository)
  const [items, setItems] = useState<InterestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

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
  }, [])

  const completedItems = useMemo(
    () => items.filter((item) => item.deletedAt === undefined && item.status === 'completed'),
    [items],
  )

  const deletedItems = useMemo(
    () => items.filter((item) => item.deletedAt !== undefined),
    [items],
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
        <div className={'flex flex-wrap items-center gap-3'}>
          <Button asChild variant={'outline'}>
            <a href={'/dashboard'}>{t('archive.backAction')}</a>
          </Button>
        </div>
      )}
      description={t('archive.subtitle')}
      eyebrow={t('archive.eyebrow')}
      title={t('archive.title')}
    >
      <div className={'space-y-6'}>
        {completedItems.length > 0 ? (
          <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-5'}>
            {categorySummaries.map(({ category, count }) => (
              <Card className={cn('bg-background/40', category.surfaceClassName)} key={category.key}>
                <CardHeader>
                  <CardDescription className={category.textClassName}>{category.label}</CardDescription>
                  <CardTitle className={'text-3xl'}>{count}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

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
          <section className={'space-y-4'}>
            <div className={'space-y-1'}>
              <h2 className={'text-2xl font-semibold tracking-tight text-foreground'}>{t('archive.completedSectionTitle')}</h2>
              <p className={'text-sm text-muted-foreground'}>{t('archive.completedSectionDescription')}</p>
            </div>

            <div className={'grid gap-4 xl:grid-cols-2'}>
              {completedItems.map((item) => {
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

        {!isLoading && deletedItems.length > 0 ? (
          <section className={'space-y-4'}>
            <div className={'space-y-1'}>
              <h2 className={'text-2xl font-semibold tracking-tight text-foreground'}>{t('archive.deletedSectionTitle')}</h2>
              <p className={'text-sm text-muted-foreground'}>{t('archive.deletedSectionDescription')}</p>
            </div>

            <div className={'grid gap-4 xl:grid-cols-2'}>
              {deletedItems.map((item) => {
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
