import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { formatPublicListDisplayDate } from '@/features/items/public-list-date-format'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import type { PublicListManagementSummary, PublicListRepository } from '@/features/items/public-list-repository'
import { useLocale } from '@/i18n/locale-provider'

type MyPublicListsScreenProps = { authenticatedOwnerId?: string, repository?: PublicListRepository }
type MyPublicListsState = { status: 'error' } | { lists: PublicListManagementSummary[], message: string | null, pendingListId: string | null, status: 'ready' } | { status: 'loading' }

function getPublicListHref(list: PublicListManagementSummary) {
  return `/u/${list.ownerNamespace}/${list.slug}`
}

function getManagedPublicListHref(list: PublicListManagementSummary) {
  return `/dashboard/public-lists/${list.id}`
}

export function MyPublicListsScreen({ authenticatedOwnerId, repository }: MyPublicListsScreenProps = {}) {
  const { client, user } = useOptionalPocketBaseAuth()
  const { locale, t } = useLocale()
  const ownerId = authenticatedOwnerId ?? user?.id ?? ''
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
        setState({ lists: [], message: null, pendingListId: null, status: 'ready' })
        return
      }
      try {
        const lists = await runtimeRepository.listMine()
        if (isMounted) {
          setState({ lists, message: null, pendingListId: null, status: 'ready' })
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


  async function handleDeleteList(list: PublicListManagementSummary) {
    if (state.status !== 'ready' || !runtimeRepository) {
      return
    }

    const confirmed = window.confirm(t('myPublicLists.deleteConfirmMessage'))

    if (!confirmed) {
      return
    }

    const committedLists = state.lists

    setState({ ...state, message: t('myPublicLists.deletePending'), pendingListId: list.id })

    const result = await runtimeRepository.deleteManagedList(ownerId, list.id)

    if (!result.ok) {
      setState({ ...state, lists: committedLists, message: t('myPublicLists.deleteError'), pendingListId: null })
      return
    }

    setState({
      lists: committedLists.filter((candidate) => candidate.id !== list.id),
      message: t('myPublicLists.deleteSuccess'),
      pendingListId: null,
      status: 'ready',
    })
  }

  return (
    <AppShell
      actions={(
        <Button asChild size={'icon'} title={t('myPublicLists.createAction')}>
          <a href={'/dashboard/public-lists/new'}>
            <Plus aria-hidden={'true'} />
            <span className={'sr-only'}>{t('myPublicLists.createAction')}</span>
          </a>
        </Button>
      )}
      appHeaderCurrentView={'publicLists'}
      contentVariant={'plain'}
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
      {state.status === 'ready' && state.message ? (
        <p className={'text-sm text-muted-foreground'} role={state.pendingListId ? 'status' : 'alert'}>{state.message}</p>
      ) : null}
      {state.status === 'ready' && state.lists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('myPublicLists.emptyTitle')}</CardTitle>
            <CardDescription>{t('myPublicLists.emptyDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {state.status === 'ready' && state.lists.length > 0 ? (
        <div className={'grid gap-4 md:grid-cols-2'}>
          {state.lists.map((list) => {
            const publicHref = getPublicListHref(list)
            const managedHref = getManagedPublicListHref(list)
            const description = list.description?.trim() || t('myPublicLists.descriptionFallback')
            const openTitle = t('myPublicLists.urlActionTitle').replace('{title}', list.title)
            return (
              <Card key={list.id} role={'article'}>
                <CardHeader className={'flex-row items-start justify-between gap-4'}>
                  <div className={'min-w-0 space-y-1'}>
                    <CardTitle>{list.title}</CardTitle>
                    <p className={'text-sm text-muted-foreground'}>{formatPublicListDisplayDate(list.listDate, locale)}</p>
                    <CardDescription className={'pt-2 text-foreground/80'}>{description}</CardDescription>
                  </div>
                  <div className={'flex shrink-0 flex-wrap justify-end gap-2'}>
                    <Button asChild size={'icon'} title={openTitle} variant={'outline'}>
                      <a aria-label={`${t('myPublicLists.urlAction')}: ${list.title}`} href={publicHref}>
                        <ExternalLink aria-hidden={'true'} />
                      </a>
                    </Button>
                    <Button asChild size={'icon'} title={t('myPublicLists.manageAction')}>
                      <a aria-label={`${t('myPublicLists.manageAction')}: ${list.title}`} href={managedHref}>
                        <Pencil aria-hidden={'true'} />
                      </a>
                    </Button>
                    <Button
                      aria-label={`${t('myPublicLists.deleteAction')}: ${list.title}`}
                      disabled={state.pendingListId !== null}
                      onClick={() => void handleDeleteList(list)}
                      size={'icon'}
                      title={t('myPublicLists.deleteAction')}
                      type={'button'}
                      variant={'destructive'}
                    >
                      <Trash2 aria-hidden={'true'} />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : null}
    </AppShell>
  )
}
