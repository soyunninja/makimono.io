import { type DragEvent, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'

import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { RichInterestComposer, type RichInterestFormValues } from '@/features/items/add-flow'
import type { InterestCoverResolver } from '@/features/items/cover-metadata'
import { listCategoryMetadata } from '@/features/items/metadata'
import { createPocketBasePublicListItemSaveRepository, type PublicListItemSaveRepository } from '@/features/items/public-list-item-save-repository'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import { mapRichInterestFormValuesToPublicListItem } from '@/features/items/public-list-item-mapper'
import { applyPublicListItemSaveCounts, resolvePublicOwnerUsername, type PublicList, type PublicListItem } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

type PublicListEditorScreenProps = {
  authenticatedUser?: PocketBaseAuthRecord | null
  coverResolver?: InterestCoverResolver
  listId: string
  publicListItemSaveRepository?: PublicListItemSaveRepository
  publicListRepository?: PublicListRepository
}

type EditorState =
  | { status: 'error' }
  | { status: 'loading' }
  | { status: 'not_found' }
  | { list: PublicList, message: string | null, pendingItemId: string | null, status: 'ready' }

export function PublicListEditorScreen({
  authenticatedUser,
  coverResolver,
  listId,
  publicListItemSaveRepository,
  publicListRepository,
}: PublicListEditorScreenProps) {
  const { client, publicProfile, user: authUser } = useOptionalPocketBaseAuth()
  const { dictionary, locale, t } = useLocale()
  const user = authenticatedUser ?? authUser
  const ownerUsername = resolvePublicOwnerUsername({
    profileUsername: publicProfile?.username,
    userUsername: user?.username,
  })
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
      ownerNamespace: ownerUsername,
    })
  }, [client, ownerUsername, publicListRepository, user])
  const runtimePublicListItemSaveRepository = useMemo(() => {
    if (publicListItemSaveRepository) {
      return publicListItemSaveRepository
    }

    if (!client) {
      return null
    }

    return createPocketBasePublicListItemSaveRepository({
      collection: client.collection('public_list_item_saves'),
      savedByUserId: user?.id,
    })
  }, [client, publicListItemSaveRepository, user])

  const [state, setState] = useState<EditorState>({ status: 'loading' })
  const [isRichComposerOpen, setIsRichComposerOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEditor() {
      setState({ status: 'loading' })

      if (!runtimePublicListRepository || !user) {
        setState({ status: 'not_found' })
        return
      }

      try {
        const list = await runtimePublicListRepository.getManagedList(user.id, listId)

        if (!isMounted) {
          return
        }

        if (!list) {
          setState({ status: 'not_found' })
          return
        }

        const saveCounts = await runtimePublicListItemSaveRepository?.getItemSaveCounts(list.id)

        setState({
          list: saveCounts ? applyPublicListItemSaveCounts(list, saveCounts) : list,
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
  }, [listId, runtimePublicListItemSaveRepository, runtimePublicListRepository, user])

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
      list: result.list,
      message: t('myPublicLists.editorCreateListOnlySuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  async function handleUpdateListOnlyItem(values: RichInterestFormValues) {
    if (state.status !== 'ready' || !runtimePublicListRepository || !user || !editingItemId) {
      return
    }

    const committedList = state.list
    const nextItems = committedList.items.map((item) => {
      if (item.id !== editingItemId) {
        return item
      }

      return mapRichInterestFormValuesToExistingPublicListItem(item, values)
    })

    setState({ ...state, message: t('myPublicLists.editorEditListOnlyPending'), pendingItemId: editingItemId })

    const result = await runtimePublicListRepository.updateManagedList({
      authenticatedOwnerId: user.id,
      id: committedList.id,
      items: nextItems,
    })

    if (!result.ok) {
      setState({ ...state, list: committedList, message: t('myPublicLists.editorEditListOnlyError'), pendingItemId: null })
      return
    }

    setEditingItemId(null)
    setState({
      list: result.list,
      message: t('myPublicLists.editorEditListOnlySuccess'),
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
      list: result.list,
      message: t('myPublicLists.editorRemoveSuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  async function persistPublicListItemOrder(committedList: PublicList, nextItems: PublicList['items'], pendingItemId: string) {
    if (state.status !== 'ready' || !runtimePublicListRepository || !user) {
      return
    }

    if (nextItems === committedList.items) {
      return
    }

    setState({ ...state, message: t('myPublicLists.editorMovePending'), pendingItemId })

    const result = await runtimePublicListRepository.updateManagedList({
      authenticatedOwnerId: user.id,
      id: committedList.id,
      items: nextItems,
    })

    if (!result.ok) {
      setState({ ...state, list: committedList, message: t('myPublicLists.editorMoveError'), pendingItemId: null })
      return
    }

    setState({
      list: result.list,
      message: t('myPublicLists.editorMoveSuccess'),
      pendingItemId: null,
      status: 'ready',
    })
  }

  async function handleMovePublicListItem(itemId: string, direction: 'down' | 'up') {
    if (state.status !== 'ready') {
      return
    }

    const committedList = state.list
    const nextItems = movePublicListItemWithinCategory(committedList.items, itemId, direction)

    await persistPublicListItemOrder(committedList, nextItems, itemId)
  }

  async function handleDropPublicListItem(event: DragEvent<HTMLLIElement>, targetItemId: string) {
    event.preventDefault()

    if (state.status !== 'ready') {
      return
    }

    const droppedItemId = event.dataTransfer.getData('text/plain') || draggedItemId

    if (!droppedItemId) {
      setDraggedItemId(null)
      return
    }

    const committedList = state.list
    const nextItems = movePublicListItemToTargetWithinCategory(committedList.items, droppedItemId, targetItemId)

    setDraggedItemId(null)
    await persistPublicListItemOrder(committedList, nextItems, droppedItemId)
  }

  const editingItem = state.status === 'ready' && editingItemId
    ? state.list.items.find((item) => item.id === editingItemId) ?? null
    : null

  return (
    <AppShell
      appHeaderCurrentView={'publicLists'}
      actions={state.status === 'ready' ? (
        <Button asChild size={'icon'} variant={'outline'}>
          <a aria-label={t('myPublicLists.urlAction')} href={`/u/${state.list.ownerNamespace}/${state.list.slug}`} title={t('myPublicLists.urlAction')}>
            <ExternalLink aria-hidden={'true'} />
          </a>
        </Button>
      ) : null}
      contentVariant={'plain'}
      description={state.status === 'ready' ? state.list.description?.trim() || t('myPublicLists.descriptionFallback') : undefined}
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
          {state.message ? <p className={'text-sm text-muted-foreground'} role={state.pendingItemId ? 'status' : 'alert'}>{state.message}</p> : null}

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

          {editingItem ? (
            <RichInterestComposer
              key={editingItem.id}
              composerTitle={dictionary.myPublicLists.editorEditListOnlyTitle}
              coverResolver={coverResolver}
              initialValues={publicListItemToRichInterestFormValues(editingItem)}
              onRequestClose={() => setEditingItemId(null)}
              onSubmit={handleUpdateListOnlyItem}
              statusMessage={state.message}
              statusRole={state.pendingItemId ? 'status' : 'alert'}
              submitLabel={dictionary.myPublicLists.editorEditListOnlySubmitAction}
            />
          ) : null}

          <Card>
            <CardHeader className={'flex-row items-start justify-between gap-4'}>
              <div className={'space-y-2'}>
                <CardTitle>{t('myPublicLists.editorItemsTitle')}</CardTitle>
                {t('myPublicLists.editorItemsDescription').trim() ? <CardDescription>{t('myPublicLists.editorItemsDescription')}</CardDescription> : null}
              </div>
              <Button
                aria-label={state.pendingItemId?.startsWith('public-list-only-') ? dictionary.myPublicLists.editorCreateListOnlySubmittingAction : dictionary.myPublicLists.editorCreateListOnlyOpenAction}
                className={'size-14 rounded-2xl [&_svg]:size-8'}
                disabled={state.pendingItemId !== null}
                onClick={() => {
                  setEditingItemId(null)
                  setIsRichComposerOpen(true)
                }}
                size={'icon'}
                title={dictionary.myPublicLists.editorCreateListOnlyOpenAction}
                type={'button'}
              >
                <Plus aria-hidden={'true'} />
              </Button>
            </CardHeader>
            <CardContent>
              {state.list.items.length === 0 ? (
                <div className={'rounded-2xl border border-dashed p-6 text-center'}>
                  <p className={'font-semibold'}>{t('myPublicLists.editorEmptyTitle')}</p>
                  <p className={'mt-2 text-sm text-muted-foreground'}>{t('myPublicLists.editorEmptyDescription')}</p>
                </div>
              ) : (
                <div aria-label={t('myPublicLists.editorSavedItemsLabel')} className={'grid gap-4 lg:grid-cols-2'} role={'list'}>
                  {listCategoryMetadata(locale).map((metadata) => {
                    const categoryItems = state.list.items.filter((item) => item.category === metadata.key)

                    return (
                      <section className={cn('rounded-2xl border border-l-4 p-4', metadata.cardBorderClassName)} key={metadata.key}>
                        <h3 className={cn('text-lg font-semibold tracking-tight', metadata.textClassName)}>{metadata.label}</h3>
                        {categoryItems.length === 0 ? (
                          <p className={'mt-3 text-sm text-muted-foreground'}>{t('myPublicLists.editorCategoryEmpty')}</p>
                        ) : (
                          <ul aria-label={`${metadata.label}: ${t('myPublicLists.editorSavedItemsLabel')}`} className={'mt-3 grid gap-3'}>
                            {categoryItems.map((item, index) => (
                              <li
                                draggable={state.pendingItemId === null}
                                key={item.id}
                                onDragEnd={() => setDraggedItemId(null)}
                                onDragOver={(event) => {
                                  if (state.pendingItemId !== null || draggedItemId === null || draggedItemId === item.id) {
                                    return
                                  }

                                  event.preventDefault()
                                  event.dataTransfer.dropEffect = 'move'
                                }}
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = 'move'
                                  event.dataTransfer.setData('text/plain', item.id)
                                  setDraggedItemId(item.id)
                                }}
                                onDrop={(event) => void handleDropPublicListItem(event, item.id)}
                                className={cn(
                                  'flex cursor-grab flex-col gap-3 rounded-xl border bg-background/60 p-3 transition sm:flex-row sm:items-start sm:justify-between',
                                  state.pendingItemId === null ? 'active:cursor-grabbing' : 'cursor-not-allowed',
                                  draggedItemId === item.id ? 'opacity-50' : null,
                                )}
                              >
                                <div className={'min-w-0'}>
                                  <div className={'flex flex-wrap items-center gap-2'}>
                                    <h4 className={'text-base font-semibold'}>{item.title}</h4>
                                    {(item.savedCount ?? 0) > 0 ? (
                                      <Badge variant={'outline'}>
                                        {dictionary.myPublicLists.editorSavedCountBadge.replace('{count}', String(item.savedCount))}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                                <div className={'flex shrink-0 flex-wrap gap-2'}>
                                  <Button
                                    aria-label={`${t('myPublicLists.editorMoveUpAction')}: ${item.title}`}
                                    disabled={state.pendingItemId !== null || index === 0}
                                    onClick={() => void handleMovePublicListItem(item.id, 'up')}
                                    className={'size-8 [&_svg]:size-4'}
                                    size={'icon'}
                                    type={'button'}
                                    variant={'outline'}
                                  >
                                    <ArrowUp aria-hidden={'true'} />
                                  </Button>
                                  <Button
                                    aria-label={`${t('myPublicLists.editorMoveDownAction')}: ${item.title}`}
                                    disabled={state.pendingItemId !== null || index === categoryItems.length - 1}
                                    onClick={() => void handleMovePublicListItem(item.id, 'down')}
                                    className={'size-8 [&_svg]:size-4'}
                                    size={'icon'}
                                    type={'button'}
                                    variant={'outline'}
                                  >
                                    <ArrowDown aria-hidden={'true'} />
                                  </Button>
                                  <Button
                                    aria-label={`${dictionary.myPublicLists.editorEditAction}: ${item.title}`}
                                    disabled={state.pendingItemId !== null}
                                    onClick={() => {
                                      setIsRichComposerOpen(false)
                                      setEditingItemId(item.id)
                                    }}
                                    className={'size-8 [&_svg]:size-4'}
                                    size={'icon'}
                                    type={'button'}
                                    variant={'outline'}
                                  >
                                    <Pencil aria-hidden={'true'} />
                                  </Button>
                                  <Button
                                    aria-label={`${state.pendingItemId === item.id ? dictionary.myPublicLists.editorRemovingAction : dictionary.myPublicLists.editorRemoveAction}: ${item.title}`}
                                    disabled={state.pendingItemId !== null}
                                    onClick={() => void handleRemovePublicListItem(item.id)}
                                    className={'size-8 [&_svg]:size-4'}
                                    size={'icon'}
                                    type={'button'}
                                    variant={'destructive'}
                                  >
                                    {state.pendingItemId === item.id ? <Check aria-hidden={'true'} /> : <Trash2 aria-hidden={'true'} />}
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}


function publicListItemToRichInterestFormValues(item: PublicListItem): RichInterestFormValues {
  return {
    category: item.category,
    title: item.title,
    ...(item.notes ? { notes: item.notes } : {}),
    tags: [...item.tags],
    ...(item.coverImageUrl ? { coverImageUrl: item.coverImageUrl } : {}),
    ...(item.coverProvider ? { coverProvider: item.coverProvider } : {}),
    ...(item.coverMatchedTitle ? { coverMatchedTitle: item.coverMatchedTitle } : {}),
  }
}

function mapRichInterestFormValuesToExistingPublicListItem(item: PublicListItem, values: RichInterestFormValues): PublicListItem {
  return {
    id: item.id,
    category: values.category,
    title: values.title,
    ...(values.notes ? { notes: values.notes } : {}),
    tags: values.tags,
    ...(values.coverImageUrl ? { coverImageUrl: values.coverImageUrl } : {}),
    ...(values.coverProvider ? { coverProvider: values.coverProvider } : {}),
    ...(values.coverMatchedTitle ? { coverMatchedTitle: values.coverMatchedTitle } : {}),
  }
}

function movePublicListItemWithinCategory(items: PublicList['items'], itemId: string, direction: 'down' | 'up') {
  const item = items.find((candidate) => candidate.id === itemId)

  if (!item) {
    return items
  }

  const sameCategoryIndexes = items
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.category === item.category)
    .map(({ index }) => index)
  const currentCategoryIndex = sameCategoryIndexes.indexOf(items.findIndex((candidate) => candidate.id === itemId))
  const nextCategoryIndex = direction === 'up' ? currentCategoryIndex - 1 : currentCategoryIndex + 1

  if (currentCategoryIndex < 0 || nextCategoryIndex < 0 || nextCategoryIndex >= sameCategoryIndexes.length) {
    return items
  }

  const currentGlobalIndex = sameCategoryIndexes[currentCategoryIndex]
  const nextGlobalIndex = sameCategoryIndexes[nextCategoryIndex]
  const nextItems = [...items]

  nextItems[currentGlobalIndex] = items[nextGlobalIndex]
  nextItems[nextGlobalIndex] = items[currentGlobalIndex]

  return nextItems
}

function movePublicListItemToTargetWithinCategory(items: PublicList['items'], itemId: string, targetItemId: string) {
  if (!itemId || itemId === targetItemId) {
    return items
  }

  const item = items.find((candidate) => candidate.id === itemId)
  const targetItem = items.find((candidate) => candidate.id === targetItemId)

  if (!item || !targetItem || item.category !== targetItem.category) {
    return items
  }

  const categoryItems = items.filter((candidate) => candidate.category === item.category)
  const currentCategoryIndex = categoryItems.findIndex((candidate) => candidate.id === itemId)
  const targetCategoryIndex = categoryItems.findIndex((candidate) => candidate.id === targetItemId)

  if (currentCategoryIndex < 0 || targetCategoryIndex < 0 || currentCategoryIndex === targetCategoryIndex) {
    return items
  }

  const reorderedCategoryItems = [...categoryItems]
  const [movedItem] = reorderedCategoryItems.splice(currentCategoryIndex, 1)

  reorderedCategoryItems.splice(targetCategoryIndex, 0, movedItem)

  let categoryItemIndex = 0

  return items.map((candidate) => {
    if (candidate.category !== item.category) {
      return candidate
    }

    const nextItem = reorderedCategoryItems[categoryItemIndex]

    categoryItemIndex += 1

    return nextItem
  })
}
