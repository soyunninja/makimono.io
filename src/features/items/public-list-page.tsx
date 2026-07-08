import { BookmarkCheck, Check, Image, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { DashboardDisplayPreferenceControl } from '@/features/items/dashboard-display-preference-control'
import { publicListDisplayPreferenceStorageKey, useDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import type { DashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { createPocketBasePublicListItemSaveRepository, recordPublicListItemSaveBestEffort } from '@/features/items/public-list-item-save-repository'
import type { PublicList, PublicListItem } from '@/features/items/public-list-types'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import type { CreateInterestItemInput, InterestItem } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type PublicListPageProps = { list: PublicList | null }
type PublicListSaveState = { message: string | null, pendingItemId: 'all' | string | null }

export function PublicListPage({ list }: PublicListPageProps) {
  const { dictionary, locale } = useLocale()
  const { client, isAuthenticated, user } = useOptionalPocketBaseAuth()
  const interestRepository = useAppInterestRepository()
  const [displayPreference, setDisplayPreference] = useDashboardDisplayPreference(publicListDisplayPreferenceStorageKey)
  const [saveState, setSaveState] = useState<PublicListSaveState>({ message: null, pendingItemId: null })
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(() => new Set())
  const publicListItemSaveRepository = useMemo(() => {
    if (!client || !user) {
      return null
    }

    return createPocketBasePublicListItemSaveRepository({
      collection: client.collection('public_list_item_saves'),
      savedByUserId: user.id,
    })
  }, [client, user])

  useEffect(() => {
    let isMounted = true

    async function loadSavedItemIds() {
      if (!list || !isAuthenticated) {
        setSavedItemIds(new Set())
        return
      }

      try {
        const privateItems = await interestRepository.listItems()

        if (isMounted) {
          setSavedItemIds(findSavedPublicListItemIds(list.items, privateItems))
        }
      }
      catch {
        if (isMounted) {
          setSavedItemIds(new Set())
        }
      }
    }

    void loadSavedItemIds()

    return () => {
      isMounted = false
    }
  }, [interestRepository, isAuthenticated, list])

  if (!list) {
    return (
      <AppShell
        contentVariant="plain"
        description={dictionary.publicList.notFoundDescription}
        eyebrow="Makimono"
        title={dictionary.publicList.notFoundTitle}
      >
        <section className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Makimono</p>
        </section>
      </AppShell>
    )
  }

  const publicList = list
  const formattedPublishedDate = formatPublicListDate(publicList.publishedAt, locale)

  async function handleSaveItem(item: PublicListItem) {
    if (!isAuthenticated) {
      return
    }

    setSaveState({ message: dictionary.publicList.addToInterestsPending, pendingItemId: item.id })

    try {
      await interestRepository.createItem(mapPublicListItemToInterestInput(item))
      await recordPublicListItemSaveBestEffort(publicListItemSaveRepository, { itemId: item.id, publicListId: publicList.id })
      setSavedItemIds((currentIds) => new Set([...currentIds, item.id]))
      setSaveState({ message: dictionary.publicList.addToInterestsSuccess, pendingItemId: null })
    }
    catch {
      setSaveState({ message: dictionary.publicList.addToInterestsError, pendingItemId: null })
    }
  }

  async function handleSaveAllItems() {
    const unsavedItems = publicList.items.filter((item) => !savedItemIds.has(item.id))

    if (!isAuthenticated || unsavedItems.length === 0) {
      return
    }

    setSaveState({ message: dictionary.publicList.addAllToInterestsPending, pendingItemId: 'all' })

    try {
      for (const item of unsavedItems) {
        await interestRepository.createItem(mapPublicListItemToInterestInput(item))
        await recordPublicListItemSaveBestEffort(publicListItemSaveRepository, { itemId: item.id, publicListId: publicList.id })
        setSavedItemIds((currentIds) => new Set([...currentIds, item.id]))
      }

      setSaveState({ message: dictionary.publicList.addAllToInterestsSuccess, pendingItemId: null })
    }
    catch {
      setSaveState({ message: dictionary.publicList.addToInterestsError, pendingItemId: null })
    }
  }

  return (
    <AppShell
      contentVariant="plain"
      showPageHeader={false}
      title={list.title}
    >
      <article className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border bg-gradient-to-br from-accent-purple/15 via-accent-red/10 to-accent-yellow/15 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <a aria-label={`View ${list.owner.displayName} public profile`} className="flex items-center gap-2 rounded-full transition-colors hover:!text-white" href={`/u/${list.ownerNamespace}`}>
                <PublicOwnerAvatar list={list} />
                <span className="font-semibold text-foreground">{list.owner.displayName}</span>
              </a>
              <span aria-hidden="true">|</span>
              <time dateTime={list.publishedAt}>{formattedPublishedDate}</time>
            </div>
            {list.items.length ? (
              <PublicListSaveAllAction
                allItemsSaved={publicList.items.every((item) => savedItemIds.has(item.id))}
                isAuthenticated={isAuthenticated}
                isPending={saveState.pendingItemId === 'all'}
                onSaveAll={() => void handleSaveAllItems()}
              />
            ) : null}
          </div>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {list.title}
          </h1>
          {list.description ? (
            <p className="mt-3 max-w-2xl text-pretty text-base font-medium leading-7 text-foreground/85 sm:text-lg">
              {list.description}
            </p>
          ) : null}
        </header>

        {list.items.length ? (
          <div className="flex justify-end">
            <DashboardDisplayPreferenceControl
              className="justify-end"
              name="public-list-display-preference"
              onChange={setDisplayPreference}
              value={displayPreference}
              variant="icon"
            />
          </div>
        ) : null}
        {saveState.message ? <p className="text-sm text-muted-foreground" role={saveState.pendingItemId ? 'status' : 'alert'}>{saveState.message}</p> : null}

        <section aria-labelledby="public-list-items-heading">
          <h2 id="public-list-items-heading" className="sr-only">
            {dictionary.publicList.itemsHeading}
          </h2>
          {list.items.length && displayPreference === 'list' ? (
            <PublicListGroupedListItems
              isAuthenticated={isAuthenticated}
              items={list.items}
              onSaveItem={(item) => void handleSaveItem(item)}
              pendingItemId={saveState.pendingItemId}
              savedItemIds={savedItemIds}
            />
          ) : null}
          {list.items.length && displayPreference !== 'list' ? (
            <ul className={cn(
              displayPreference === 'covers' ? 'columns-2 gap-4 lg:columns-3 xl:columns-4' : undefined,
              displayPreference === 'cards' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : undefined,
            )} aria-label={dictionary.publicList.itemsHeading}>
              {list.items.map((item) => (
                <PublicListDisplayItemCard
                  displayPreference={displayPreference}
                  isAuthenticated={isAuthenticated}
                  item={item}
                  key={item.id}
                  onSaveItem={(item) => void handleSaveItem(item)}
                  pendingItemId={saveState.pendingItemId}
                  savedItemIds={savedItemIds}
                />
              ))}
            </ul>
          ) : null}
          {!list.items.length ? (
            <div className="mt-5 rounded-2xl border border-dashed p-6 text-center">
              <p className="font-semibold">{dictionary.publicList.emptyTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{dictionary.publicList.emptyDescription}</p>
            </div>
          ) : null}
        </section>
      </article>
    </AppShell>
  )
}

function PublicListDisplayItemCard({
  displayPreference,
  isAuthenticated,
  item,
  onSaveItem,
  pendingItemId,
  savedItemIds,
}: {
  displayPreference: DashboardDisplayPreference
  isAuthenticated: boolean
  item: PublicListItem
  onSaveItem: (item: PublicListItem) => void
  pendingItemId: 'all' | string | null
  savedItemIds: Set<string>
}) {
  if (displayPreference === 'cards') {
    return <PublicListCardItemCard isAuthenticated={isAuthenticated} isSaved={savedItemIds.has(item.id)} item={item} onSaveItem={onSaveItem} pendingItemId={pendingItemId} />
  }

  return <PublicListCoverItemCard isAuthenticated={isAuthenticated} isSaved={savedItemIds.has(item.id)} item={item} onSaveItem={onSaveItem} pendingItemId={pendingItemId} />
}

function PublicOwnerAvatar({ list }: { list: PublicList }) {
  const { dictionary } = useLocale()
  const avatarLabel = formatDictionaryTemplate(list.owner.avatarUrl ? dictionary.publicList.avatarAlt : dictionary.publicList.avatarFallbackLabel, { owner: list.owner.displayName })

  if (list.owner.avatarUrl) {
    return (
      <img
        alt={avatarLabel}
        className="h-[25px] w-[25px] rounded-full border border-background object-cover shadow-sm"
        src={list.owner.avatarUrl}
      />
    )
  }

  return (
    <div
      aria-label={avatarLabel}
      className="grid h-[25px] w-[25px] place-items-center rounded-full bg-gradient-to-br from-accent-purple via-accent-red to-accent-yellow text-xs font-black uppercase text-white shadow-sm"
      role="img"
    >
      {list.owner.initial}
    </div>
  )
}

function PublicListCategoryBadge({ item }: { item: PublicListItem }) {
  const { locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)

  return (
    <Badge className={metadata.accentClassName} variant="outline">
      {metadata.label}
    </Badge>
  )
}

function PublicListCardItemCard({
  isAuthenticated,
  isSaved,
  item,
  onSaveItem,
  pendingItemId,
}: {
  isAuthenticated: boolean
  isSaved: boolean
  item: PublicListItem
  onSaveItem: (item: PublicListItem) => void
  pendingItemId: 'all' | string | null
}) {
  const { dictionary, locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)

  return (
    <li>
      <Card
        className={cn('relative isolate flex h-full flex-col overflow-hidden border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
        role="article"
      >
        {item.coverImageUrl ? <PublicListCardCoverBackground item={item} /> : null}
        <CardContent className="relative z-10 flex flex-1 items-start !gap-0 p-4 xl:p-6">
          {isAuthenticated ? (
            <div className="shrink-0 self-start !-translate-x-2 !-translate-y-2.5">
              <PublicListItemSaveAction
                iconOnly
                isAuthenticated={isAuthenticated}
                isPending={pendingItemId === item.id}
                isSaved={isSaved}
                item={item}
                onSaveItem={onSaveItem}
              />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PublicListCategoryBadge item={item} />
            </div>
            <div className="min-w-0 space-y-0">
              <h3 className="text-balance break-words text-xl font-semibold tracking-tight text-foreground xl:text-2xl">
                {item.title}
              </h3>
              {item.notes ? <CardDescription className={item.coverImageUrl ? 'text-foreground/80' : undefined}>{item.notes}</CardDescription> : null}
            </div>
            {item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2" aria-label={dictionary.publicList.tagsLabel}>
                {item.tags.map((tag) => (
                  <Badge className="font-mono font-medium" key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            {!isAuthenticated ? (
              <PublicListItemSaveAction
                isAuthenticated={isAuthenticated}
                isPending={pendingItemId === item.id}
                isSaved={isSaved}
                item={item}
                onSaveItem={onSaveItem}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

function PublicListGroupedListItems({
  isAuthenticated,
  items,
  onSaveItem,
  pendingItemId,
  savedItemIds,
}: {
  isAuthenticated: boolean
  items: PublicListItem[]
  onSaveItem: (item: PublicListItem) => void
  pendingItemId: 'all' | string | null
  savedItemIds: Set<string>
}) {
  const { dictionary, locale } = useLocale()
  const sections = listCategoryMetadata(locale)
    .map((metadata) => ({
      items: items.filter((item) => item.category === metadata.key),
      metadata,
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="space-y-4 md:space-y-8">
      {sections.map(({ items: sectionItems, metadata }) => (
        <section className="space-y-3" key={metadata.key}>
          <h3 className={cn('text-xl font-semibold tracking-tight', metadata.textClassName)}>{metadata.label}</h3>
          <ul aria-label={`${metadata.label} ${dictionary.publicList.itemsHeading}`} className="grid gap-x-6 gap-y-0 md:grid-cols-2 md:gap-y-3 xl:grid-cols-3">
            {sectionItems.map((item) => (
              <PublicListRowItemCard isAuthenticated={isAuthenticated} isSaved={savedItemIds.has(item.id)} item={item} key={item.id} onSaveItem={onSaveItem} pendingItemId={pendingItemId} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PublicListRowItemCard({
  isAuthenticated,
  isSaved,
  item,
  onSaveItem,
  pendingItemId,
}: {
  isAuthenticated: boolean
  isSaved: boolean
  item: PublicListItem
  onSaveItem: (item: PublicListItem) => void
  pendingItemId: 'all' | string | null
}) {
  const { locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)

  return (
    <li>
      <article className="min-w-0">
        <div className="flex min-w-0 items-center gap-3 py-0 md:py-1">
          <PublicListItemSaveAction
            iconOnly
            isAuthenticated={isAuthenticated}
            isPending={pendingItemId === item.id}
            isSaved={isSaved}
            item={item}
            onSaveItem={onSaveItem}
            size="sm"
          />
          <h3 className={cn('min-w-0 flex-1 break-words text-base font-semibold leading-6', metadata.textClassName)}>
            {item.title}
          </h3>
        </div>
      </article>
    </li>
  )
}

function PublicListCardCoverBackground({ item }: { item: PublicListItem }) {
  const { locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)

  if (!item.coverImageUrl) {
    return null
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="public-list-card-cover">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{ backgroundImage: `url("${item.coverImageUrl}")` }}
      />
      <div className={cn('absolute inset-0', metadata.surfaceClassName)} />
      <div className="absolute inset-0 bg-gradient-to-br from-background/15 via-background/55 to-background/80" />
    </div>
  )
}

function PublicListCoverItemCard({
  isAuthenticated,
  isSaved,
  item,
  onSaveItem,
  pendingItemId,
}: {
  isAuthenticated: boolean
  isSaved: boolean
  item: PublicListItem
  onSaveItem: (item: PublicListItem) => void
  pendingItemId: 'all' | string | null
}) {
  const { dictionary, locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)
  const coverAlt = formatDictionaryTemplate(dictionary.publicList.coverAlt, { title: item.title })

  return (
    <li className="mb-4 break-inside-avoid">
      <article className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <h3 className="sr-only">{item.title}</h3>
        <div className="absolute left-3 top-3 z-20">
          <PublicListItemSaveAction
            iconOnly
            isAuthenticated={isAuthenticated}
            isPending={pendingItemId === item.id}
            isSaved={isSaved}
            item={item}
            onSaveItem={onSaveItem}
          />
        </div>
        <Badge className={cn('absolute right-3 top-3 z-10 bg-background/85 shadow-sm backdrop-blur', metadata.accentClassName)} variant="outline">
          {metadata.label}
        </Badge>
        {item.coverImageUrl ? (
          <img alt={coverAlt} className="block h-auto w-full" src={item.coverImageUrl} />
        ) : (
          <div className={cn('flex aspect-[2/3] min-h-48 w-full items-center justify-center', metadata.surfaceClassName)}>
            <Image aria-hidden="true" className={cn('size-12 opacity-70', metadata.textClassName)} />
          </div>
        )}

      </article>
    </li>
  )
}

function PublicListSaveAllAction({
  allItemsSaved,
  isAuthenticated,
  isPending,
  onSaveAll,
}: {
  allItemsSaved: boolean
  isAuthenticated: boolean
  isPending: boolean
  onSaveAll: () => void
}) {
  const { dictionary } = useLocale()

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline">
        <a href="/?auth=register">{dictionary.publicList.addAllToInterestsAction}</a>
      </Button>
    )
  }

  return (
    <Button disabled={isPending || allItemsSaved} onClick={onSaveAll} type="button">
      {isPending || allItemsSaved ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {allItemsSaved ? dictionary.publicList.addAllToInterestsSuccess : isPending ? dictionary.publicList.addAllToInterestsPending : dictionary.publicList.addAllToInterestsAction}
    </Button>
  )
}

function PublicListItemSaveAction({
  iconOnly = false,
  isAuthenticated,
  isPending,
  isSaved,
  item,
  onSaveItem,
  size,
}: {
  iconOnly?: boolean
  isAuthenticated: boolean
  isPending: boolean
  isSaved: boolean
  item: PublicListItem
  onSaveItem: (item: PublicListItem) => void
  size?: 'sm'
}) {
  const { dictionary } = useLocale()

  const savedLabel = dictionary.publicList.addToInterestsSuccess.replace(/\.$/, '')
  const label = `${isSaved ? savedLabel : isPending ? dictionary.publicList.addToInterestsPending : dictionary.publicList.addToInterestsAction}: ${item.title}`

  if (!isAuthenticated) {
    if (iconOnly) {
      return (
        <Button asChild className="size-8 shrink-0 bg-background/85 shadow-sm backdrop-blur [&_svg]:size-4" size="icon" title={dictionary.publicList.registerToAddAction} variant="outline">
          <a aria-label={dictionary.publicList.registerToAddAction} href="/?auth=register">
            <Plus aria-hidden="true" />
          </a>
        </Button>
      )
    }

    return (
      <Button asChild className="w-full" size={size} variant="outline">
        <a href="/?auth=register">{dictionary.publicList.registerToAddAction}</a>
      </Button>
    )
  }

  if (iconOnly) {
    return (
      <Button
        aria-label={label}
        className={cn(
          'size-8 shrink-0 shadow-sm backdrop-blur [&_svg]:size-4',
          isSaved ? 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-900/20 disabled:opacity-100' : 'bg-background/85',
        )}
        disabled={isPending || isSaved}
        onClick={() => onSaveItem(item)}
        size="icon"
        title={label}
        type="button"
        variant="outline"
      >
        {isSaved ? <BookmarkCheck aria-hidden="true" /> : isPending ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      </Button>
    )
  }

  return (
    <Button
      className={cn(
        'w-full',
        isSaved ? 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-900/20 disabled:opacity-100' : undefined,
      )}
      disabled={isPending || isSaved}
      onClick={() => onSaveItem(item)}
      size={size}
      type="button"
      variant="outline"
    >
      {isSaved ? <BookmarkCheck aria-hidden="true" /> : isPending ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {isSaved ? dictionary.publicList.addToInterestsSuccess : isPending ? dictionary.publicList.addToInterestsPending : dictionary.publicList.addToInterestsAction}
    </Button>
  )
}

export function findSavedPublicListItemIds(publicItems: PublicListItem[], privateItems: InterestItem[]): Set<string> {
  const privateItemFingerprints = new Set(privateItems.map(getInterestItemFingerprint))

  return new Set(
    publicItems
      .filter((item) => privateItemFingerprints.has(getPublicListItemFingerprint(item)))
      .map((item) => item.id),
  )
}

function getPublicListItemFingerprint(item: PublicListItem) {
  return `${item.category}:${normalizeItemTitle(item.title)}`
}

function getInterestItemFingerprint(item: InterestItem) {
  return `${item.category}:${normalizeItemTitle(item.title)}`
}

function normalizeItemTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function mapPublicListItemToInterestInput(item: PublicListItem): CreateInterestItemInput {
  return {
    category: item.category,
    title: item.title,
    ...(item.notes !== undefined ? { notes: item.notes } : {}),
    tags: [...item.tags],
    ...(item.coverImageUrl !== undefined ? { coverImageUrl: item.coverImageUrl } : {}),
    ...(item.coverProvider !== undefined ? { coverProvider: item.coverProvider } : {}),
    ...(item.coverMatchedTitle !== undefined ? { coverMatchedTitle: item.coverMatchedTitle } : {}),
  }
}

function formatPublicListDate(value: string, locale: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

function formatDictionaryTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template)
}
