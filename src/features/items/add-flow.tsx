import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import type { Category, InterestItem, InterestRepository } from '@/features/items/types'
import { useLocale } from '@/i18n/locale-provider'

import { cn } from '@/lib/utils'

type AdaptiveAddFlowProps = {
  repository?: InterestRepository
  isDesktop?: boolean
  onCreated?: (item: InterestItem) => Promise<void> | void
  onRequestClose?: () => void
}

type AdaptiveEditFlowProps = {
  itemId: string
  repository?: InterestRepository
  isDesktop?: boolean
  onUpdated?: (item: InterestItem) => Promise<void> | void
  onDeleted?: (item: InterestItem) => Promise<void> | void
  onRequestClose?: () => void
}

function parseTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatTags(tags: string[]) {
  return tags.join(', ')
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
  tags: string
  notes: string
  onTitleChange: (value: string) => void
  onTagsChange: (value: string) => void
  onNotesChange: (value: string) => void
}

function InterestDetailsFields({ title, tags, notes, onTitleChange, onTagsChange, onNotesChange }: InterestDetailsFieldsProps) {
  const { t } = useLocale()

  return (
    <Card className="bg-background/40">
      <CardHeader>
        <CardTitle>{t('addFlow.commonDetailsHeading')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="add-interest-title">{t('addFlow.titleLabel')}</Label>
          <Input
            id="add-interest-title"
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={t('addFlow.titlePlaceholder')}
            required
            value={title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-interest-tags">{t('addFlow.tagsLabel')}</Label>
          <Input
            id="add-interest-tags"
            onChange={(event) => onTagsChange(event.target.value)}
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
      </CardContent>
    </Card>
  )
}

export function AdaptiveAddFlow({
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
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSubmitDisabled = isSubmitting || !selectedCategory || title.trim().length === 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedCategory || title.trim().length === 0 || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const createdItem = await repository.createItem({
        category: selectedCategory,
        title: title.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
        tags: parseTags(tags),
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
        <Card className="bg-background/40">
          <CardHeader>
            <CardTitle>{t('addFlow.categoryLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              className="flex flex-wrap gap-2"
              onValueChange={(value) => {
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
          </CardContent>
        </Card>

        <InterestDetailsFields
          notes={notes}
          onNotesChange={setNotes}
          onTagsChange={setTags}
          onTitleChange={setTitle}
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
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      setTags(formatTags(nextItem.tags))
      setNotes(nextItem.notes ?? '')
    }

    void loadItem()

    return () => {
      isMounted = false
    }
  }, [itemId, onRequestClose, repository])

  if (!item) {
    return null
  }

  const metadata = getCategoryMetadata(item.category, locale)
  const isSubmitDisabled = isSubmitting || isDeleting || title.trim().length === 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!item || title.trim().length === 0 || isSubmitting || isDeleting) {
      return
    }

    setIsSubmitting(true)

    try {
      const updatedItem = await repository.updateItem(item.id, {
        title: title.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
        tags: parseTags(tags),
      })

      setIsSubmitting(false)

      if (!updatedItem) {
        onRequestClose?.()
        return
      }

      setItem(updatedItem)
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
          notes={notes}
          onNotesChange={setNotes}
          onTagsChange={setTags}
          onTitleChange={setTitle}
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
