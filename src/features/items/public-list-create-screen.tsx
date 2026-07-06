import { useMemo, useState, type FormEvent } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { mapPublicOwnerProjection } from '@/features/auth/public-profile'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import type { ManagedPublicListError, PublicListRepository } from '@/features/items/public-list-repository'
import { derivePublicOwnerNamespace } from '@/features/items/public-list-types'
import { useLocale } from '@/i18n/locale-provider'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

type PublicListCreateScreenProps = {
  authenticatedUser?: PocketBaseAuthRecord | null
  onCreated?: (listId: string) => void
  repository?: PublicListRepository
}

type CreateStatus = 'idle' | 'pending' | 'success'

function navigateToManagedList(listId: string) {
  window.location.assign(`/dashboard/public-lists/${encodeURIComponent(listId)}`)
}

export function PublicListCreateScreen({
  authenticatedUser,
  onCreated = navigateToManagedList,
  repository,
}: PublicListCreateScreenProps = {}) {
  const { client, publicProfile, user: authUser } = useOptionalPocketBaseAuth()
  const { t } = useLocale()
  const user = authenticatedUser ?? authUser
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [listDate, setListDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<CreateStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedSlug = slug.trim()
    const trimmedDate = listDate.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle || !trimmedSlug || !trimmedDate) {
      setMessage(t('myPublicLists.createValidationError'))
      return
    }

    if (!runtimeRepository || !user) {
      setMessage(t('myPublicLists.createErrorUnauthenticated'))
      return
    }

    const ownerNamespace = derivePublicOwnerNamespace({
      email: typeof user.email === 'string' ? user.email : null,
      username: publicProfile?.username ?? (typeof user.username === 'string' ? user.username : null),
    })

    if (!ownerNamespace.ok) {
      setMessage(t('myPublicLists.createErrorInvalid'))
      return
    }

    setStatus('pending')
    setMessage(t('myPublicLists.createPending'))

    const ownerProjectionSource = publicProfile
      ? { ...user, avatarUrl: publicProfile.avatarUrl ?? undefined, username: publicProfile.username }
      : user
    const result = await runtimeRepository.createManagedList({
      authenticatedOwnerId: user.id,
      ...(trimmedDescription.length > 0 ? { description: trimmedDescription } : {}),
      listDate: trimmedDate,
      owner: mapPublicOwnerProjection(ownerProjectionSource),
      ownerNamespace: ownerNamespace.value,
      slug: trimmedSlug,
      title: trimmedTitle,
    })

    if (!result.ok) {
      setStatus('idle')
      setMessage(resolveCreateErrorMessage(result.error, t))
      return
    }

    setStatus('success')
    setMessage(t('myPublicLists.createSuccess'))
    onCreated(result.list.id)
  }

  return (
    <AppShell
      appHeaderCurrentView={'publicLists'}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={t('myPublicLists.createTitle')}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('myPublicLists.createTitle')}</CardTitle>
          <CardDescription>{t('myPublicLists.createDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className={'space-y-4'} onSubmit={handleSubmit}>
            <div className={'space-y-2'}>
              <Label htmlFor={'managed-public-list-title'}>{t('myPublicLists.createTitleLabel')}</Label>
              <Input id={'managed-public-list-title'} onChange={(event) => setTitle(event.currentTarget.value)} required value={title} />
            </div>

            <div className={'space-y-2'}>
              <Label htmlFor={'managed-public-list-slug'}>{t('myPublicLists.createSlugLabel')}</Label>
              <Input id={'managed-public-list-slug'} onChange={(event) => setSlug(event.currentTarget.value)} placeholder={t('myPublicLists.createSlugPlaceholder')} required value={slug} />
            </div>

            <div className={'space-y-2'}>
              <Label htmlFor={'managed-public-list-date'}>{t('myPublicLists.createDateLabel')}</Label>
              <Input id={'managed-public-list-date'} onChange={(event) => setListDate(event.currentTarget.value)} required type={'date'} value={listDate} />
            </div>

            <div className={'space-y-2'}>
              <Label htmlFor={'managed-public-list-description'}>{t('myPublicLists.createDescriptionLabel')}</Label>
              <Textarea id={'managed-public-list-description'} onChange={(event) => setDescription(event.currentTarget.value)} value={description} />
            </div>

            {message ? <p className={'text-sm text-muted-foreground'} role={status === 'idle' ? 'alert' : 'status'}>{message}</p> : null}

            <Button disabled={status === 'pending' || status === 'success'} type={'submit'}>
              {status === 'pending' ? t('myPublicLists.createSubmittingAction') : t('myPublicLists.createSubmitAction')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  )
}

function resolveCreateErrorMessage(error: ManagedPublicListError, t: (path: string) => string) {
  if (error.type === 'unauthenticated') {
    return t('myPublicLists.createErrorUnauthenticated')
  }

  if (error.type === 'slug_collision') {
    return t('myPublicLists.createErrorSlugCollision')
  }

  if (error.type === 'invalid_route_part') {
    return t('myPublicLists.createErrorInvalid')
  }

  return t('myPublicLists.createErrorGeneric')
}
