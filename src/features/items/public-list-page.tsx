import { AppShell } from '@/components/app/app-shell'
import type { PublicList, PublicListItem } from '@/features/items/public-list-types'
import { getCategoryMetadata } from '@/features/items/metadata'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type PublicListPageProps = { list: PublicList | null }

export function PublicListPage({ list }: PublicListPageProps) {
  const { dictionary, locale } = useLocale()

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

  const formattedDate = formatPublicListDate(list.listDate, locale)

  return (
    <AppShell
      contentVariant="plain"
      description={list.description}
      eyebrow="Makimono"
      title={list.title}
    >
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border bg-card shadow-sm">
        <header className="border-b bg-gradient-to-br from-accent-purple/15 via-accent-red/10 to-accent-yellow/15 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <PublicOwnerAvatar list={list} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary.publicList.ownerLabel}
                {' '}
                <span className="font-semibold text-foreground">{list.owner.displayName}</span>
              </p>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                <span className="sr-only">{dictionary.publicList.listDateLabel}: </span>
                <time dateTime={list.listDate}>{formattedDate}</time>
              </p>
            </div>
          </div>
        </header>

        <section className="p-6 sm:p-8" aria-labelledby="public-list-items-heading">
          <h2 id="public-list-items-heading" className="text-xl font-semibold tracking-tight">
            {dictionary.publicList.itemsHeading}
          </h2>
          {list.items.length ? (
            <ul className="mt-5 grid gap-4" aria-label={dictionary.publicList.itemsHeading}>
              {list.items.map((item) => (
                <PublicListItemCard key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-6 text-center">
              <p className="font-semibold">{dictionary.publicList.emptyTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{dictionary.publicList.emptyDescription}</p>
            </div>
          )}
        </section>
      </article>
    </AppShell>
  )
}

function PublicOwnerAvatar({ list }: { list: PublicList }) {
  const { dictionary } = useLocale()
  const avatarLabel = formatDictionaryTemplate(list.owner.avatarUrl ? dictionary.publicList.avatarAlt : dictionary.publicList.avatarFallbackLabel, { owner: list.owner.displayName })

  if (list.owner.avatarUrl) {
    return (
      <img
        alt={avatarLabel}
        className="size-24 rounded-full border-4 border-background object-cover shadow-md sm:size-28"
        src={list.owner.avatarUrl}
      />
    )
  }

  return (
    <div
      aria-label={avatarLabel}
      className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-accent-purple via-accent-red to-accent-yellow text-4xl font-black uppercase text-white shadow-md sm:size-28 sm:text-5xl"
      role="img"
    >
      {list.owner.initial}
    </div>
  )
}

function PublicListItemCard({ item }: { item: PublicListItem }) {
  const { dictionary, locale } = useLocale()
  const metadata = getCategoryMetadata(item.category, locale)
  const coverAlt = formatDictionaryTemplate(dictionary.publicList.coverAlt, { title: item.title })

  return (
    <li className={cn('rounded-2xl border border-l-4 bg-background p-4', metadata.cardBorderClassName)}>
      <div className="flex gap-4">
        {item.coverImageUrl ? (
          <img alt={coverAlt} className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-sm" src={item.coverImageUrl} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', metadata.textClassName)}>
            <span className="sr-only">{dictionary.publicList.categoryLabel}: </span>
            {metadata.label}
          </p>
          <h3 className="mt-2 break-words text-lg font-semibold leading-7">{item.title}</h3>
          {item.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              <span className="sr-only">{dictionary.publicList.notesLabel}: </span>
              {item.notes}
            </p>
          ) : null}
          {item.tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={dictionary.publicList.tagsLabel}>
              {item.tags.map((tag) => (
                <li key={tag} className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function formatPublicListDate(value: string, locale: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

function formatDictionaryTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template)
}
