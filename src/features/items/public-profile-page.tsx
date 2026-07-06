import { ExternalLink } from 'lucide-react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPublicListDisplayDate } from '@/features/items/public-list-date-format'
import type { PublicOwnerProfile } from '@/features/items/public-list-repository'
import { useLocale } from '@/i18n/locale-provider'

export type PublicProfilePageProps = {
  profile: PublicOwnerProfile | null
}

export function PublicProfilePage({ profile }: PublicProfilePageProps) {
  const { dictionary, locale } = useLocale()

  if (!profile) {
    return (
      <AppShell
        contentVariant="plain"
        description={dictionary.publicProfile.notFoundDescription}
        title={dictionary.publicProfile.notFoundTitle}
      >
        <section className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{dictionary.publicProfile.notFoundDescription}</p>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell contentVariant="plain" showPageHeader={false} title={profile.owner.displayName}>
      <article className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border bg-gradient-to-br from-accent-purple/15 via-accent-red/10 to-accent-yellow/15 p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <PublicProfileAvatar profile={profile} />
            <div className="min-w-0">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {profile.owner.displayName}
              </h1>
            </div>
          </div>
        </header>

        <section aria-labelledby="public-profile-lists-heading" className="space-y-4">
          <h2 id="public-profile-lists-heading" className="sr-only">
            {dictionary.publicProfile.listsHeading}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {profile.lists.map((list) => {
              const href = `/u/${list.ownerNamespace}/${list.slug}`
              const description = list.description?.trim() || dictionary.publicProfile.descriptionFallback
              const openTitle = dictionary.publicProfile.openListTitle.replace('{title}', list.title)

              return (
                <Card key={list.id} role="article">
                  <CardHeader>
                    <CardTitle>{list.title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <time className="text-sm text-muted-foreground" dateTime={list.listDate}>
                      {formatPublicListDisplayDate(list.listDate, locale)}
                    </time>
                    <Button asChild size="icon" title={openTitle} variant="outline">
                      <a aria-label={`${dictionary.publicProfile.openListAction}: ${list.title}`} href={href}>
                        <ExternalLink aria-hidden="true" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </article>
    </AppShell>
  )
}

function PublicProfileAvatar({ profile }: { profile: PublicOwnerProfile }) {
  const { dictionary } = useLocale()

  if (profile.owner.avatarUrl) {
    return (
      <img
        alt={dictionary.publicProfile.avatarAlt.replace('{owner}', profile.owner.displayName)}
        className="size-20 rounded-full border border-background object-cover shadow-sm sm:size-24"
        src={profile.owner.avatarUrl}
      />
    )
  }

  return (
    <div
      aria-label={dictionary.publicProfile.avatarFallbackLabel.replace('{owner}', profile.owner.displayName)}
      className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-accent-purple via-accent-red to-accent-yellow text-3xl font-black uppercase text-white shadow-sm sm:size-24"
      role="img"
    >
      {profile.owner.initial}
    </div>
  )
}
