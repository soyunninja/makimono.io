import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  AddCategoryFields,
  buildCategorySpecificNotes,
  createInitialCategoryFieldValues,
  type CategoryFieldValueKey,
} from '@/features/items/add-category-fields'
import { listCategoryMetadata } from '@/features/items/metadata'
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

function parseTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function mergeNotes(notes: string, categoryNotes?: string) {
  const parts = [notes.trim(), categoryNotes].filter(Boolean)

  return parts.length > 0 ? parts.join('\n\n') : undefined
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
  const [categoryFieldValues, setCategoryFieldValues] = useState(createInitialCategoryFieldValues)
  const selectedCategoryMetadata = selectedCategory
    ? categories.find((category) => category.key === selectedCategory) ?? null
    : null

  const isSubmitDisabled = isSubmitting || !selectedCategory || title.trim().length === 0

  function updateCategoryField(field: CategoryFieldValueKey, value: string) {
    if (!selectedCategory) {
      return
    }

    setCategoryFieldValues((currentValues) => ({
      ...currentValues,
      [selectedCategory]: {
        ...currentValues[selectedCategory],
        [field]: value,
      },
    }))
  }

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
        notes: mergeNotes(
          notes,
          buildCategorySpecificNotes(selectedCategory, categoryFieldValues[selectedCategory], t),
        ),
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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('addFlow.title')}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t('addFlow.description')}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="bg-background/40">
          <CardHeader>
            <CardTitle>{t('addFlow.categoryLabel')}</CardTitle>
            <CardDescription>{t('addFlow.categoryHint')}</CardDescription>
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

        <Card className="bg-background/40">
          <CardHeader>
            <CardTitle>{t('addFlow.commonDetailsHeading')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-interest-title">{t('addFlow.titleLabel')}</Label>
              <Input
                id="add-interest-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('addFlow.titlePlaceholder')}
                required
                value={title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-interest-tags">{t('addFlow.tagsLabel')}</Label>
              <Input
                id="add-interest-tags"
                onChange={(event) => setTags(event.target.value)}
                placeholder={t('addFlow.tagsPlaceholder')}
                value={tags}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-interest-notes">{t('addFlow.notesLabel')}</Label>
              <Textarea
                id="add-interest-notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t('addFlow.notesPlaceholder')}
                value={notes}
              />
            </div>
          </CardContent>
        </Card>

        {selectedCategory && selectedCategoryMetadata ? (
          <AddCategoryFields
            category={selectedCategory}
            metadata={selectedCategoryMetadata}
            onChange={updateCategoryField}
            t={t}
            values={categoryFieldValues[selectedCategory]}
          />
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onRequestClose} type="button" variant="outline">
            {t('addFlow.cancel')}
          </Button>
          <Button disabled={isSubmitDisabled} type="submit">
            {t('addFlow.submit')}
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
