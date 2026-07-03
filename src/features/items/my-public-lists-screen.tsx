import { ExternalLink, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import type { PublicListManagementSummary, PublicListRepository } from '@/features/items/public-list-repository'
import { useLocale } from '@/i18n/locale-provider'

type MyPublicListsScreenProps = { repository?: PublicListRepository }
type MyPublicListsState = { status: 'error' } | { lists: PublicListManagementSummary[], status: 'ready' } | { status: 'loading' }

function getPublicListHref(list: PublicListManagementSummary) {
  return `/u/${list.ownerNamespace}/lista/${list.slug}`
}

function getManagedPublicListHref(list: PublicListManagementSummary) {
  return `/dashboard/public-lists/${list.id}`
}

export function MyPublicListsScreen({ repository }: MyPublicListsScreenProps = {}) {
  const { client, user } = useOptionalPocketBaseAuth()
  const { t } = useLocale()
  const [state, setState] = useState<MyPublicListsState>({ status: 'loading' })
  const runtimeRepository = useMemo(() => {
    if (repository) {
      return repository
    }
    if (!client || !user) {
      return null
    }
    return createPocketBasePublicListRepository({
      collection: client.collection('public_lists'),
      ownerId: user.id,
    })
  }, [client, repository, user])

  useEffect(() => {
    let isMounted = true
    async function loadPublicLists() {
      setState({ status: 'loading' })
      if (!runtimeRepository) {
        setState({ lists: [], status: 'ready' })
        return
      }
      try {
        const lists = await runtimeRepository.listMine()
        if (isMounted) {
          setState({ lists, status: 'ready' })
        }
      }
      catch {
        if (isMounted) {
          setState({ status: 'error' })
        }
      }
    }
    void loadPublicLists()
    return () => {
      isMounted = false
    }
  }, [runtimeRepository])

  return (
    <AppShell
      actions={(
        <div className={'flex flex-nowrap items-center justify-end gap-3'}>
          <Button asChild className={'bg-brand-sun text-night hover:bg-brand-sun/90'}>
            <a href={'/dashboard/public-lists/new'}>
              <Plus aria-hidden={'true'} />
              {t('myPublicLists.createAction')}
            </a>
          </Button>
          <DashboardOverflowMenu currentView={'publicLists'} />
        </div>
      )}
      contentVariant={'plain'}
      eyebrow={'Makimono'}
      title={t('myPublicLists.title')}
    >
      {state.status === 'loading' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('myPublicLists.loading')}</CardTitle>
          </CardHeader>
        </Card>
      ) : null}
      {state.status === 'error' ? (
        <Card role={'alert'}>
          <CardHeader>
            <CardTitle>{t('myPublicLists.errorTitle')}</CardTitle>
            <CardDescription>{t('myPublicLists.errorDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {state.status === 'ready' && state.lists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('myPublicLists.emptyTitle')}</CardTitle>
            <CardDescription>{t('myPublicLists.emptyDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={'/dashboard/public-lists/new'}>{t('myPublicLists.createAction')}</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {state.status === 'ready' && state.lists.length > 0 ? (
        <div className={'grid gap-4 md:grid-cols-2'}>
          {state.lists.map((list) => {
            const publicHref = getPublicListHref(list)
            const managedHref = getManagedPublicListHref(list)
            const description = list.description?.trim() || t('myPublicLists.descriptionFallback')
            return (
              <Card key={list.id} role={'article'}>
                <CardHeader>
                  <CardTitle>{list.title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className={'space-y-4'}>
                  <dl className={'space-y-2 text-sm'}>
                    <div>
                      <dt className={'font-medium text-foreground'}>{t('myPublicLists.urlLabel')}</dt>
                      <dd className={'break-all text-muted-foreground'}>{publicHref}</dd>
                    </div>
                    <div>
                      <dt className={'font-medium text-foreground'}>{t('publicList.listDateLabel')}</dt>
                      <dd className={'text-muted-foreground'}>{list.listDate}</dd>
                    </div>
                  </dl>
                  <div className={'flex flex-wrap gap-2'}>
                    <Button asChild>
                      <a href={managedHref}>
                        <Pencil aria-hidden={'true'} />
                        {t('myPublicLists.manageAction')}
                      </a>
                    </Button>
                    <Button asChild variant={'outline'}>
                      <a href={publicHref}>
                        <ExternalLink aria-hidden={'true'} />
                        {t('myPublicLists.urlAction')}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </AppShell>
  )
}
