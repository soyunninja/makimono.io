import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TagsInput } from '@/components/ui/tags-input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { resolveInterestCoverMetadata, type InterestCoverResolver } from '@/features/items/cover-metadata'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import type { Category, CoverProvider, InterestItem, InterestItemCoverMetadata, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'

import { cn } from '@/lib/utils'

type AdaptiveAddFlowProps = {
  coverResolver?: InterestCoverResolver
  repository?: InterestRepository
  isDesktop?: boolean
  onCreated?: (item: InterestItem) => Promise<void> | void
  onRequestClose?: () => void
}

type AdaptiveEditFlowProps = {
  itemId: string
  coverResolver?: InterestCoverResolver
  repository?: InterestRepository
  isDesktop?: boolean
  onUpdated?: (item: InterestItem) => Promise<void> | void
  onDeleted?: (item: InterestItem) => Promise<void> | void
  onRequestClose?: () => void
}

function getRemoveTagLabel(template: string, tag: string) {
  return template.replace('{tag}', tag)
}

const COVER_LOOKUP_TIMEOUT_MS = 3500

const defaultCoverResolver: InterestCoverResolver = (input) => {
  // Approved by openspec/changes/add-cover-metadata-cache: optional client-side
  // cover lookups are allowed for this mock-only MVP as long as saves remain local.
  return resolveInterestCoverMetadata(input)
}

const clearedCoverMetadata = {
  coverImageUrl: undefined,
  coverMatchedTitle: undefined,
  coverProvider: undefined,
} as const

type EditableCoverMetadata = {
  coverImageUrl: string | undefined
  coverMatchedTitle: string | undefined
  coverProvider: CoverProvider | undefined
}

type CoverLookupStatus = 'idle' | 'searching' | 'found' | 'not_found'

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getCoverLookupCategory(category: Category): Category {
  return category === 'podcasts' ? 'music' : category
}

function toEditableCoverMetadata(coverMetadata?: InterestItemCoverMetadata | null): EditableCoverMetadata {
  return {
    coverImageUrl: coverMetadata?.coverImageUrl,
    coverMatchedTitle: coverMetadata?.coverMatchedTitle,
    coverProvider: coverMetadata?.coverProvider,
  }
}

function hasSelectedCover(coverMetadata: EditableCoverMetadata): coverMetadata is EditableCoverMetadata & { coverImageUrl: string } {
  return typeof coverMetadata.coverImageUrl === 'string' && coverMetadata.coverImageUrl.trim().length > 0
}

function getCoverProviderLabel(provider: CoverProvider) {
  switch (provider) {
    case 'tmdb':
      return 'TMDB'
    case 'rawg':
      return 'RAWG'
    case 'cover-art-archive':
      return 'Cover Art Archive'
  }
}

async function lookupCoverMetadata(
  coverResolver: InterestCoverResolver,
  category: Category,
  title: string,
) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, COVER_LOOKUP_TIMEOUT_MS)

  try {
    return await coverResolver({
      category: getCoverLookupCategory(category),
      signal: controller.signal,
      title,
    })
  }
  catch (error) {
    if (isAbortError(error)) {
      return null
    }

    return null
  }
  finally {
    window.clearTimeout(timeoutId)
  }
}

function useDesktopBreakpoint(forcedValue?: boolean) {
  const [isDesktop, setIsDesktop] = useState(forcedValue ?? false)

  useEffect(() => {
    if (typeof forcedValue === 'boolean') {
      setIsDesktop(forcedValue)
      return
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)')

    const syncValue = (matches: boolean) => {
      setIsDesktop(matches)
    }

    syncValue(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      syncValue(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    mediaQuery.addListener(handleChange)

    return () => {
      mediaQuery.removeListener(handleChange)
    }
  }, [forcedValue])

  return isDesktop
}

type InterestDetailsFieldsProps = {
  title: string
  tags: string[]
  notes: string
  categoryFields?: ReactNode
  coverFields?: ReactNode
  surface?: 'card' | 'plain'
  onTitleChange: (value: string) => void
  onTagsChange: (value: string[]) => void
  onNotesChange: (value: string) => void
}

type CoverPreviewFieldsProps = {
  category: Category | null
  title: string
  coverMetadata: EditableCoverMetadata
  lookupStatus: CoverLookupStatus
  onLookup: () => void
  onRemove: () => void
}

function CoverPreviewFields({ category, title, coverMetadata, lookupStatus, onLookup, onRemove }: CoverPreviewFieldsProps) {
  const { t } = useLocale()
  const isSearching = lookupStatus === 'searching'
  const hasCover = hasSelectedCover(coverMetadata)
  const isLookupDisabled = isSearching || !category || title.trim().length === 0
  const providerLabel = coverMetadata.coverProvider ? getCoverProviderLabel(coverMetadata.coverProvider) : null

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-background/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={isLookupDisabled} onClick={onLookup} size="sm" type="button" variant="outline">
          {t('addFlow.findCoverAction')}
        </Button>

        {hasCover
          ? (
              <Button disabled={isSearching} onClick={onRemove} size="sm" type="button" variant="ghost">
                {t('addFlow.removeCoverAction')}
              </Button>
            )
          : null}
      </div>

      {isSearching
        ? (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {t('addFlow.coverLookupSearching')}
            </p>
          )
        : null}

      {lookupStatus === 'not_found'
        ? (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {t('addFlow.coverLookupNotFound')}
            </p>
          )
        : null}

      {hasCover
        ? (
            <div className="flex items-start gap-3 rounded-md border border-border/60 bg-background/70 p-3">
              <img
                alt={t('addFlow.coverPreviewAlt')}
                className="h-24 w-16 rounded-md border border-border/60 object-cover shadow-sm"
                src={coverMetadata.coverImageUrl}
              />

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t('addFlow.coverFoundStatus')}</p>

                {coverMetadata.coverMatchedTitle
                  ? (
                      <p>
                        <span className="font-medium text-foreground">{t('addFlow.coverMatchedTitleLabel')}</span>
                        {' '}
                        {coverMetadata.coverMatchedTitle}
                      </p>
                    )
                  : null}

                {providerLabel
                  ? (
                      <p>
                        <span className="font-medium text-foreground">{t('addFlow.coverProviderLabel')}</span>
                        {' '}
                        {providerLabel}
                      </p>
                    )
                  : null}
              </div>
            </div>
          )
        : null}
    </div>
  )
}

function InterestDetailsFields({ title, tags, notes, categoryFields, coverFields, surface = 'card', onTitleChange, onTagsChange, onNotesChange }: InterestDetailsFieldsProps) {
  const { t } = useLocale()

  const fields = (
    <div className="space-y-4">
      {categoryFields}

      <div className="space-y-2">
        <Label htmlFor="add-interest-title">{t('addFlow.titleLabel')}</Label>
        <Input
          id="add-interest-title"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={t('addFlow.titlePlaceholder')}
          required
          value={title}
        />

        {coverFields}
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-interest-tags">{t('addFlow.tagsLabel')}</Label>
        <TagsInput
          getRemoveTagLabel={(tag) => getRemoveTagLabel(t('addFlow.removeTagAction'), tag)}
          id="add-interest-tags"
          onValueChange={onTagsChange}
          placeholder={t('addFlow.tagsPlaceholder')}
          value={tags}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-interest-notes">{t('addFlow.notesLabel')}</Label>
        <Textarea
          id="add-interest-notes"
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder={t('addFlow.notesPlaceholder')}
          value={notes}
        />
      </div>
    </div>
  )

  if (surface === 'plain') {
    return fields
  }

  return (
    <Card className="bg-background/40">
      <CardHeader>
        <CardTitle>{t('addFlow.commonDetailsHeading')}</CardTitle>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  )
}

export function AdaptiveAddFlow({
  coverResolver = defaultCoverResolver,
  repository = getAppInterestRepository(),
  isDesktop,
  onCreated,
  onRequestClose,
}: AdaptiveAddFlowProps) {
  const { locale, t } = useLocale()
  const resolvedIsDesktop = useDesktopBreakpoint(isDesktop)
  const categories = useMemo(() => listCategoryMetadata(locale), [locale])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverMetadata, setCoverMetadata] = useState<EditableCoverMetadata>(toEditableCoverMetadata())
  const [coverLookupStatus, setCoverLookupStatus] = useState<CoverLookupStatus>('idle')

  const isSubmitDisabled = isSubmitting || !selectedCategory || title.trim().length === 0

  async function handleFindCover() {
    if (!selectedCategory || title.trim().length === 0 || coverLookupStatus === 'searching') {
      return
    }

    setCoverLookupStatus('searching')

    const resolvedCoverMetadata = await lookupCoverMetadata(coverResolver, selectedCategory, title.trim())

    setCoverMetadata(toEditableCoverMetadata(resolvedCoverMetadata))
    setCoverLookupStatus(resolvedCoverMetadata ? 'found' : 'not_found')
  }

  function handleRemoveCover() {
    setCoverMetadata(toEditableCoverMetadata())
    setCoverLookupStatus('idle')
  }

  function handleTitleChange(value: string) {
    setTitle(value)

    if (coverLookupStatus !== 'searching') {
      setCoverLookupStatus('idle')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedCategory || title.trim().length === 0 || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const trimmedTitle = title.trim()
      const createdItem = await repository.createItem({
        category: selectedCategory,
        title: trimmedTitle,
        notes: notes.trim() ? notes.trim() : undefined,
        tags,
        ...coverMetadata,
      })

      setIsSubmitting(false)
      await onCreated?.(createdItem)
    }
    catch (error) {
      setIsSubmitting(false)
      throw error
    }
  }

  const formContent = (
    <div className="flex max-h-[85vh] flex-col gap-6 overflow-y-auto px-1 pb-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('addFlow.title')}</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InterestDetailsFields
          categoryFields={(
            <div className="space-y-2">
              <Label>{t('addFlow.categoryLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('addFlow.categoryHint')}</p>
              <ToggleGroup
                aria-label={t('addFlow.categoryLabel')}
                className="flex flex-wrap gap-2"
                onValueChange={(value) => {
                  setCoverMetadata(toEditableCoverMetadata())
                  setCoverLookupStatus('idle')
                  setSelectedCategory((value as Category) || null)
                }}
                type="single"
                value={selectedCategory ?? ''}
              >
                {categories.map((category) => (
                  <ToggleGroupItem
                    className={cn('data-[state=on]:border-current data-[state=on]:bg-current/15', category.controlClassName)}
                    key={category.key}
                    value={category.key}
                    variant="outline"
                  >
                    {category.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
          coverFields={(
            <CoverPreviewFields
              category={selectedCategory}
              coverMetadata={coverMetadata}
              lookupStatus={coverLookupStatus}
              onLookup={() => {
                void handleFindCover()
              }}
              onRemove={handleRemoveCover}
              title={title}
            />
          )}
          notes={notes}
          onNotesChange={setNotes}
          onTagsChange={setTags}
          onTitleChange={handleTitleChange}
          tags={tags}
          title={title}
        />

        <div className="flex justify-end">
          <Button aria-label={t('addFlow.submit')} disabled={isSubmitDisabled} size="icon" type="submit">
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </form>
    </div>
  )

  if (resolvedIsDesktop) {
    return (
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            onRequestClose?.()
          }
        }}
        open
      >
        <DialogContent className="max-h-[90vh] overflow-hidden" closeLabel={t('app.closeLabel')}>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onRequestClose?.()
        }
      }}
      open
    >
      <SheetContent className="rounded-t-3xl border-x border-t border-border/70" closeLabel={t('app.closeLabel')} side="bottom">
        {formContent}
      </SheetContent>
    </Sheet>
  )
}

export function AdaptiveEditFlow({
  itemId,
  coverResolver = defaultCoverResolver,
  repository = getAppInterestRepository(),
  isDesktop,
  onUpdated,
  onDeleted,
  onRequestClose,
}: AdaptiveEditFlowProps) {
  const { locale, t } = useLocale()
  const resolvedIsDesktop = useDesktopBreakpoint(isDesktop)
  const [item, setItem] = useState<InterestItem | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [coverMetadata, setCoverMetadata] = useState<EditableCoverMetadata>(toEditableCoverMetadata())
  const [coverLookupStatus, setCoverLookupStatus] = useState<CoverLookupStatus>('idle')

  useEffect(() => {
    let isMounted = true

    async function loadItem() {
      const nextItem = (await repository.listItems()).find((entry) => entry.id === itemId) ?? null

      if (!isMounted) {
        return
      }

      if (!nextItem) {
        onRequestClose?.()
        return
      }

      setItem(nextItem)
      setTitle(nextItem.title)
      setTags(nextItem.tags)
      setNotes(nextItem.notes ?? '')
      setCoverMetadata(toEditableCoverMetadata(nextItem))
      setCoverLookupStatus('idle')
    }

    void loadItem()

    return () => {
      isMounted = false
    }
  }, [itemId, onRequestClose, repository])

  if (!item) {
    return null
  }

  const itemCategory = item.category
  const metadata = getCategoryMetadata(itemCategory, locale)
  const isSubmitDisabled = isSubmitting || isDeleting || title.trim().length === 0

  async function handleFindCover() {
    if (title.trim().length === 0 || coverLookupStatus === 'searching') {
      return
    }

    setCoverLookupStatus('searching')

    const resolvedCoverMetadata = await lookupCoverMetadata(coverResolver, itemCategory, title.trim())

    setCoverMetadata(toEditableCoverMetadata(resolvedCoverMetadata))
    setCoverLookupStatus(resolvedCoverMetadata ? 'found' : 'not_found')
  }

  function handleRemoveCover() {
    setCoverMetadata(toEditableCoverMetadata())
    setCoverLookupStatus('idle')
  }

  function handleTitleChange(value: string) {
    setTitle(value)

    if (coverLookupStatus !== 'searching') {
      setCoverLookupStatus('idle')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!item || title.trim().length === 0 || isSubmitting || isDeleting) {
      return
    }

    setIsSubmitting(true)

    try {
      const trimmedTitle = title.trim()
      const updatedItem = await repository.updateItem(item.id, {
        title: trimmedTitle,
        notes: notes.trim() ? notes.trim() : undefined,
        tags,
        ...coverMetadata,
      })

      setIsSubmitting(false)

      if (!updatedItem) {
        onRequestClose?.()
        return
      }

      setItem(updatedItem)
      setCoverMetadata(toEditableCoverMetadata(updatedItem))
      setCoverLookupStatus('idle')
      await onUpdated?.(updatedItem)
    }
    catch (error) {
      setIsSubmitting(false)
      throw error
    }
  }

  async function handleDelete() {
    if (!item || isSubmitting || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      const deletedItem = await repository.deleteItem(item.id)

      setIsDeleting(false)

      if (!deletedItem) {
        onRequestClose?.()
        return
      }

      if (onDeleted) {
        await onDeleted(deletedItem)
        return
      }

      onRequestClose?.()
    }
    catch (error) {
      setIsDeleting(false)
      throw error
    }
  }

  const formContent = (
    <div className="flex max-h-[85vh] flex-col gap-6 overflow-y-auto px-1 pb-1">
      <div className="pr-12">
        <div className="flex min-h-6 items-center">
          <Badge className={metadata.accentClassName} variant="outline">
            {metadata.label}
          </Badge>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <InterestDetailsFields
          coverFields={(
            <CoverPreviewFields
              category={itemCategory}
              coverMetadata={coverMetadata}
              lookupStatus={coverLookupStatus}
              onLookup={() => {
                void handleFindCover()
              }}
              onRemove={handleRemoveCover}
              title={title}
            />
          )}
          notes={notes}
          onNotesChange={setNotes}
          onTagsChange={setTags}
          onTitleChange={handleTitleChange}
          surface="plain"
          tags={tags}
          title={title}
        />

        <div className="flex items-center justify-between border-t border-border/70 pt-4">
          <Button
            aria-label={t('dashboard.deleteEditAction')}
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
            size="icon"
            type="button"
            variant="destructive"
          >
            <Trash2 />
          </Button>

          <Button aria-label={t('dashboard.saveAction')} disabled={isSubmitDisabled} size="icon" type="submit">
            <Save />
          </Button>
        </div>
      </form>
    </div>
  )

  if (resolvedIsDesktop) {
    return (
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            onRequestClose?.()
          }
        }}
        open
      >
        <DialogContent
          aria-description={t('dashboard.editDescription')}
          aria-label={t('dashboard.editTitle')}
          className="max-h-[90vh] overflow-hidden"
          closeLabel={t('app.closeLabel')}
        >
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onRequestClose?.()
        }
      }}
      open
    >
      <SheetContent
        aria-description={t('dashboard.editDescription')}
        aria-label={t('dashboard.editTitle')}
        className="rounded-t-3xl border-x border-t border-border/70"
        closeLabel={t('app.closeLabel')}
        side="bottom"
      >
        {formContent}
      </SheetContent>
    </Sheet>
  )
}
