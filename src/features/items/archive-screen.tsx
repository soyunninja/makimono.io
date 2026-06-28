import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { LanguageToggle } from '@/components/app/language-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import type { InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'

type ArchiveScreenProps = {
  repository?: InterestRepository
}

function formatCreatedAt(createdAt: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(createdAt))
}

export function ArchiveScreen({ repository = getAppInterestRepository() }: ArchiveScreenProps) {
  const { locale, t } = useLocale()
  const repositoryRef = useRef<InterestRepository>(repository)
  const [items, setItems] = useState<InterestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

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
  }, [])

  const completedItems = useMemo(
    () => items.filter((item) => item.status === 'completed'),
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

  async function handleRestore(item: InterestItem) {
    const updatedItem = await repositoryRef.current.updateStatus(item.id, 'pending')

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
          <Badge variant={'outline'}>{t('archive.localDataBadge')}</Badge>
          <LanguageToggle />
        </div>
      )}
      description={t('archive.subtitle')}
      eyebrow={t('archive.eyebrow')}
      title={t('archive.title')}
    >
      <div className={'space-y-6'}>
        <p className={'max-w-2xl text-sm leading-6 text-muted-foreground'}>{t('archive.localDataNote')}</p>

        <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-5'}>
          {categorySummaries.map(({ category, count }) => (
            <Card className={'bg-background/40'} key={category.key}>
              <CardHeader>
                <CardDescription>{category.label}</CardDescription>
                <CardTitle className={'text-3xl'}>{count}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('archive.loading')}</CardTitle>
              <CardDescription>{t('archive.localDataNote')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && completedItems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('archive.emptyTitle')}</CardTitle>
              <CardDescription>{t('archive.emptyDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && completedItems.length > 0 ? (
          <div className={'grid gap-4 xl:grid-cols-2'}>
            {completedItems.map((item) => {
              const metadata = getCategoryMetadata(item.category, locale)

              return (
                <Card className={'border-l-4 bg-background/40'} key={item.id} role={'article'}>
                  <CardHeader className={'gap-4'}>
                    <div className={'flex flex-wrap items-start justify-between gap-3'}>
                      <div className={'space-y-2'}>
                        <Badge className={metadata.accentClassName} variant={'outline'}>
                          {metadata.label}
                        </Badge>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.notes ?? metadata.statusLabels.completed}</CardDescription>
                      </div>

                      <Badge variant={'default'}>{metadata.statusLabels.completed}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className={'space-y-4'}>
                    <div className={'flex flex-wrap gap-2'}>
                      {item.tags.map((tag) => (
                        <Badge className={'font-mono font-medium'} key={tag} variant={'outline'}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className={'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'}>
                      <p className={'text-xs uppercase tracking-[0.18em] text-muted-foreground'}>
                        {formatCreatedAt(item.createdAt, locale)}
                      </p>
                      <Button onClick={() => void handleRestore(item)} type={'button'} variant={'secondary'}>
                        {t('archive.restoreAction')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
