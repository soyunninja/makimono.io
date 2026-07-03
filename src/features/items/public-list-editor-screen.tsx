import { useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, Plus, Trash2 } from 'lucide-react'

import { AppShell } from '@/components/app/app-shell'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { RichInterestComposer, type RichInterestFormValues } from '@/features/items/add-flow'
import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import type { InterestCoverResolver } from '@/features/items/cover-metadata'
import { getCategoryMetadata } from '@/features/items/metadata'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import { appendPublicListItemSnapshot, mapRichInterestFormValuesToPublicListItem } from '@/features/items/public-list-item-mapper'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import type { InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'
import { getPocketBaseFileUrl, type PocketBaseAuthRecord } from '@/lib/pocketbase'

type PublicListEditorScreenProps = {
  authenticatedUser?: PocketBaseAuthRecord | null
  coverResolver?: InterestCoverResolver
  interestRepository?: InterestRepository
  listId: string
  publicListRepository?: PublicListRepository
}

type EditorState =
  | { status: 'error' }
  | { status: 'loading' }
  | { status: 'not_found' }
  | { currentUserItems: InterestItem[], eligibleItems: InterestItem[], list: PublicList, message: string | null, pendingItemId: string | null, status: 'ready' }

export function PublicListEditorScreen({
  authenticatedUser,
  coverResolver,
  interestRepository,
  listId,
  publicListRepository,
}: PublicListEditorScreenProps) {
  const { client, user: authUser } = useOptionalPocketBaseAuth()
  const appInterestRepository = useAppInterestRepository()
  const { dictionary, locale, t } = useLocale()
  const user = authenticatedUser ?? authUser
  const runtimeInterestRepository = interestRepository ?? appInterestRepository
  const runtimePublicListRepository = useMemo(() => {
    if (publicListRepository) {
      return publicListRepository
    }

    if (!client || !user) {
      return null
    }

    return createPocketBasePublicListRepository({
      collection: client.collection('public_lists'),
      ownerId: user.id,
      resolveOwnerAvatarUrl: (recordId, fileName) => getPocketBaseFileUrl('public_lists', recordId, fileName),
    })
  }, [client, publicListRepository, user])

  const [state, setState] = useState<EditorState>({ status: 'loading' })
  const [isRichComposerOpen, setIsRichComposerOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadEditor() {
      setState({ status: 'loading' })

      if (!runtimePublicListRepository || !user) {
        setState({ status: 'not_found' })
        return
      }

      try {
        const [list, currentUserItems] = await Promise.all([
          runtimePublicListRepository.getManagedList(user.id, listId),
          runtimeInterestRepository.listItems(),
        ])

        if (!isMounted) {
          return
        }

        if (!list) {
          setState({ status: 'not_found' })
          return
        }

        setState({
          currentUserItems,
          eligibleItems: getEligibleItems(currentUserItems, list),
          list,
          message: null,
          pendingItemId: null,
          status: 'ready',
        })
      }
      catch {
        if (isMounted) {
          setState({ status: 'error' })
        }
      }
    }

    void loadEditor()

    return () => {
      isMounted = false
    }
  }, [listId, runtimeInterestRepository, runtimePublicListRepository, user])

  async function handleAddInterest(item: InterestItem) {
    if (state.status !== 'ready' || !runtimePublicListRepository || !user) {
      return
    }

    const committedList = state.list
    const nextItems = appendPublicListItemSnapshot(committedList.items, item)

    setState({ ...state, message: t('myPublicLists.editorAddPending'), pendingItemId: item.id })

    const result = await runtimePublicListRepository.updateManagedList({
      authenticatedOwnerId: user.id,
      id: committedList.id,
      items: nextItems,
    })

    if (!result.ok) {
      setState({ ...state, list: committedList, message: t('myPublicLists.editorAddError'), pendingItemId: null })
      return
    }

    setState({
      currentUserItems: state.currentUserItems,
      eligibleItems: getEligibleItems(state.currentUserItems, result.list),
      list: result.list,
      message: t('myPublicLists.editorAddSuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  async function handleCreateListOnlyItem(values: RichInterestFormValues) {
    if (state.status !== 'ready' || !runtimePublicListRepository || !user) {
      return
    }

    const committedList = state.list
    const item = mapRichInterestFormValuesToPublicListItem(values, committedList.items)
    const nextItems = [...committedList.items, item]

    setState({ ...state, message: t('myPublicLists.editorCreateListOnlyPending'), pendingItemId: item.id })

    const result = await runtimePublicListRepository.updateManagedList({
      authenticatedOwnerId: user.id,
      id: committedList.id,
      items: nextItems,
    })

    if (!result.ok) {
      setState({ ...state, list: committedList, message: t('myPublicLists.editorCreateListOnlyError'), pendingItemId: null })
      return
    }

    setIsRichComposerOpen(false)
    setState({
      currentUserItems: state.currentUserItems,
      eligibleItems: getEligibleItems(state.currentUserItems, result.list),
      list: result.list,
      message: t('myPublicLists.editorCreateListOnlySuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  async function handleRemovePublicListItem(itemId: string) {
    if (state.status !== 'ready' || !runtimePublicListRepository || !user) {
      return
    }

    const committedList = state.list
    const nextItems = committedList.items.filter((item) => item.id !== itemId)

    setState({ ...state, message: t('myPublicLists.editorRemovePending'), pendingItemId: itemId })

    const result = await runtimePublicListRepository.updateManagedList({
      authenticatedOwnerId: user.id,
      id: committedList.id,
      items: nextItems,
    })

    if (!result.ok) {
      setState({ ...state, list: committedList, message: t('myPublicLists.editorRemoveError'), pendingItemId: null })
      return
    }

    setState({
      currentUserItems: state.currentUserItems,
      eligibleItems: getEligibleItems(state.currentUserItems, result.list),
      list: result.list,
      message: t('myPublicLists.editorRemoveSuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  return (
    <AppShell
      actions={(
        <div className={'flex flex-nowrap items-center justify-end gap-3'}>
          <DashboardOverflowMenu currentView={'publicLists'} />
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={state.status === 'ready' ? state.list.title : t('myPublicLists.editorTitle')}
    >
      {state.status === 'loading' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('myPublicLists.editorLoading')}</CardTitle>
          </CardHeader>
        </Card>
      ) : null}

      {state.status === 'error' ? (
        <Card role={'alert'}>
          <CardHeader>
            <CardTitle>{t('myPublicLists.editorErrorTitle')}</CardTitle>
            <CardDescription>{t('myPublicLists.editorErrorDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {state.status === 'not_found' ? (
        <Card role={'alert'}>
          <CardHeader>
            <CardTitle>{t('myPublicLists.editorDeniedTitle')}</CardTitle>
            <CardDescription>{t('myPublicLists.editorDeniedDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {state.status === 'ready' ? (
        <div className={'space-y-4'}>
          <Card>
            <CardHeader>
              <CardTitle>{state.list.title}</CardTitle>
              <CardDescription>{state.list.description?.trim() || t('myPublicLists.descriptionFallback')}</CardDescription>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <dl className={'grid gap-3 text-sm sm:grid-cols-2'}>
                <div>
                  <dt className={'font-medium text-foreground'}>{t('myPublicLists.urlLabel')}</dt>
                  <dd className={'break-all text-muted-foreground'}>/u/{state.list.ownerNamespace}/lista/{state.list.slug}</dd>
                </div>
                <div>
                  <dt className={'font-medium text-foreground'}>{t('publicList.listDateLabel')}</dt>
                  <dd className={'text-muted-foreground'}>{state.list.listDate}</dd>
                </div>
              </dl>
              <Button asChild variant={'outline'}>
                <a href={`/u/${state.list.ownerNamespace}/lista/${state.list.slug}`}>
                  <ExternalLink aria-hidden={'true'} />
                  {t('myPublicLists.urlAction')}
                </a>
              </Button>
            </CardContent>
          </Card>

          {state.message ? <p className={'text-sm text-muted-foreground'} role={state.pendingItemId ? 'status' : 'alert'}>{state.message}</p> : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('myPublicLists.editorCreateListOnlyTitle')}</CardTitle>
              <CardDescription>{t('myPublicLists.editorCreateListOnlyDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={state.pendingItemId !== null} onClick={() => setIsRichComposerOpen(true)} type={'button'}>
                <Plus aria-hidden={'true'} />
                {state.pendingItemId?.startsWith('public-list-only-') ? dictionary.myPublicLists.editorCreateListOnlySubmittingAction : dictionary.myPublicLists.editorCreateListOnlyOpenAction}
              </Button>
            </CardContent>
          </Card>

          {isRichComposerOpen ? (
            <RichInterestComposer
              composerTitle={dictionary.myPublicLists.editorCreateListOnlyTitle}
              coverResolver={coverResolver}
              onRequestClose={() => setIsRichComposerOpen(false)}
              onSubmit={handleCreateListOnlyItem}
              statusMessage={state.message}
              statusRole={state.pendingItemId ? 'status' : 'alert'}
              submitLabel={dictionary.myPublicLists.editorCreateListOnlySubmitAction}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('myPublicLists.editorItemsTitle')}</CardTitle>
              <CardDescription>{t('myPublicLists.editorItemsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {state.list.items.length === 0 ? (
                <div className={'rounded-2xl border border-dashed p-6 text-center'}>
                  <p className={'font-semibold'}>{t('myPublicLists.editorEmptyTitle')}</p>
                  <p className={'mt-2 text-sm text-muted-foreground'}>{t('myPublicLists.editorEmptyDescription')}</p>
                </div>
              ) : (
                <ul aria-label={t('myPublicLists.editorSavedItemsLabel')} className={'grid gap-3'}>
                  {state.list.items.map((item) => {
                    const metadata = getCategoryMetadata(item.category, locale)
                    return (
                      <li key={item.id} className={cn('flex flex-col gap-3 rounded-2xl border border-l-4 p-4 sm:flex-row sm:items-start sm:justify-between', metadata.cardBorderClassName)}>
                        <div>
                          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', metadata.textClassName)}>{metadata.label}</p>
                          <h3 className={'mt-2 text-lg font-semibold'}>{item.title}</h3>
                          {item.notes ? <p className={'mt-2 text-sm text-muted-foreground'}>{item.notes}</p> : null}
                        </div>
                        <Button disabled={state.pendingItemId !== null} onClick={() => void handleRemovePublicListItem(item.id)} type={'button'} variant={'outline'}>
                          {state.pendingItemId === item.id ? <Check aria-hidden={'true'} /> : <Trash2 aria-hidden={'true'} />}
                          {state.pendingItemId === item.id ? dictionary.myPublicLists.editorRemovingAction : dictionary.myPublicLists.editorRemoveAction}
                          <span className={'sr-only'}>: {item.title}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('myPublicLists.editorEligibleTitle')}</CardTitle>
              <CardDescription>{t('myPublicLists.editorEligibleDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {state.eligibleItems.length === 0 ? (
                <p className={'text-sm text-muted-foreground'}>{t('myPublicLists.editorNoEligibleItems')}</p>
              ) : (
                <ul aria-label={t('myPublicLists.editorEligibleItemsLabel')} className={'grid gap-3'}>
                  {state.eligibleItems.map((item) => {
                    const metadata = getCategoryMetadata(item.category, locale)
                    const isPending = state.pendingItemId === item.id
                    return (
                      <li key={item.id} className={'flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between'}>
                        <div>
                          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', metadata.textClassName)}>{metadata.label}</p>
                          <h3 className={'mt-2 text-base font-semibold'}>{item.title}</h3>
                        </div>
                        <Button disabled={state.pendingItemId !== null} onClick={() => void handleAddInterest(item)} type={'button'}>
                          {isPending ? <Check aria-hidden={'true'} /> : <Plus aria-hidden={'true'} />}
                          {isPending ? dictionary.myPublicLists.editorAddingAction : dictionary.myPublicLists.editorAddAction}
                          <span className={'sr-only'}>: {item.title}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}

function getEligibleItems(items: InterestItem[], list: PublicList) {
  const existingItemIds = new Set(list.items.map((item) => item.id))

  return items.filter((item) => !item.deletedAt && !existingItemIds.has(item.id))
}
