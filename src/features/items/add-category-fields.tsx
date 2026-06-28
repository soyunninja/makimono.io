import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryMetadata } from '@/features/items/metadata'
import type { Category } from '@/features/items/types'

import { cn } from '@/lib/utils'

const categoryFieldConfig = {
  series: {
    headingKey: 'addFlow.categoryFields.series.heading',
    fields: [
      {
        key: 'primary',
        labelKey: 'addFlow.categoryFields.series.primaryLabel',
        placeholderKey: 'addFlow.categoryFields.series.primaryPlaceholder',
      },
      {
        key: 'secondary',
        labelKey: 'addFlow.categoryFields.series.secondaryLabel',
        placeholderKey: 'addFlow.categoryFields.series.secondaryPlaceholder',
      },
    ],
  },
  movies: {
    headingKey: 'addFlow.categoryFields.movies.heading',
    fields: [
      {
        key: 'primary',
        labelKey: 'addFlow.categoryFields.movies.primaryLabel',
        placeholderKey: 'addFlow.categoryFields.movies.primaryPlaceholder',
      },
      {
        key: 'secondary',
        labelKey: 'addFlow.categoryFields.movies.secondaryLabel',
        placeholderKey: 'addFlow.categoryFields.movies.secondaryPlaceholder',
      },
    ],
  },
  games: {
    headingKey: 'addFlow.categoryFields.games.heading',
    fields: [
      {
        key: 'primary',
        labelKey: 'addFlow.categoryFields.games.primaryLabel',
        placeholderKey: 'addFlow.categoryFields.games.primaryPlaceholder',
      },
      {
        key: 'secondary',
        labelKey: 'addFlow.categoryFields.games.secondaryLabel',
        placeholderKey: 'addFlow.categoryFields.games.secondaryPlaceholder',
      },
    ],
  },
  books: {
    headingKey: 'addFlow.categoryFields.books.heading',
    fields: [
      {
        key: 'primary',
        labelKey: 'addFlow.categoryFields.books.primaryLabel',
        placeholderKey: 'addFlow.categoryFields.books.primaryPlaceholder',
      },
      {
        key: 'secondary',
        labelKey: 'addFlow.categoryFields.books.secondaryLabel',
        placeholderKey: 'addFlow.categoryFields.books.secondaryPlaceholder',
      },
    ],
  },
  webs: {
    headingKey: 'addFlow.categoryFields.webs.heading',
    fields: [
      {
        key: 'primary',
        labelKey: 'addFlow.categoryFields.webs.primaryLabel',
        placeholderKey: 'addFlow.categoryFields.webs.primaryPlaceholder',
      },
      {
        key: 'secondary',
        labelKey: 'addFlow.categoryFields.webs.secondaryLabel',
        placeholderKey: 'addFlow.categoryFields.webs.secondaryPlaceholder',
      },
    ],
  },
} as const satisfies Record<
  Category,
  {
    headingKey: string
    fields: ReadonlyArray<{
      key: 'primary' | 'secondary'
      labelKey: string
      placeholderKey: string
    }>
  }
>

export type CategoryFieldValueKey = 'primary' | 'secondary'

export type CategoryFieldValues = Record<Category, Record<CategoryFieldValueKey, string>>

export function createInitialCategoryFieldValues(): CategoryFieldValues {
  return {
    series: { primary: '', secondary: '' },
    movies: { primary: '', secondary: '' },
    games: { primary: '', secondary: '' },
    books: { primary: '', secondary: '' },
    webs: { primary: '', secondary: '' },
  }
}

type AddCategoryFieldsProps = {
  category: Category
  metadata: CategoryMetadata
  values: Record<CategoryFieldValueKey, string>
  t: (path: string) => string
  onChange: (field: CategoryFieldValueKey, value: string) => void
}

export function AddCategoryFields({ category, metadata, values, t, onChange }: AddCategoryFieldsProps) {
  const config = categoryFieldConfig[category]

  return (
    <Card className={cn('border-l-4 bg-background/40', metadata.cardBorderClassName, metadata.surfaceClassName)}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{t('addFlow.categoryDetailsHeading')}</CardTitle>
          <Badge className={metadata.accentClassName} variant="outline">
            {metadata.label}
          </Badge>
        </div>
        <CardDescription>{t(config.headingKey)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {config.fields.map((field) => {
          const inputId = `${category}-${field.key}`

          return (
            <div className="space-y-2" key={field.labelKey}>
              <Label htmlFor={inputId}>{t(field.labelKey)}</Label>
              <Input
                id={inputId}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={t(field.placeholderKey)}
                value={values[field.key]}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function buildCategorySpecificNotes(category: Category, values: Record<CategoryFieldValueKey, string>, t: (path: string) => string) {
  const config = categoryFieldConfig[category]

  const lines = config.fields.flatMap((field) => {
    const value = values[field.key].trim()

    if (!value) {
      return []
    }

    return [`${t(field.labelKey)}: ${value}`]
  })

  return lines.length > 0 ? lines.join('\n') : undefined
}
