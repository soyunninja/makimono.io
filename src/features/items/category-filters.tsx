import type { CategoryMetadata } from '@/features/items/metadata'
import type { Category } from '@/features/items/types'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type CategoryFiltersProps = {
  categories: Array<CategoryMetadata & { count: number }>
  label: string
  allLabel: string
  totalCount: number
  value: Category | 'all'
  onValueChange: (value: Category | 'all') => void
}

export function CategoryFilters({
  categories,
  label,
  allLabel,
  totalCount,
  value,
  onValueChange,
}: CategoryFiltersProps) {
  return (
    <div>
      <ToggleGroup
        aria-label={label}
        className="flex flex-wrap justify-start gap-2"
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue as Category | 'all')
          }
        }}
        type="single"
        value={value}
      >
        <ToggleGroupItem value="all" variant="outline">
          {`${allLabel} (${totalCount})`}
        </ToggleGroupItem>

        {categories.map((category) => (
          <ToggleGroupItem
            className={cn(
              'data-[state=on]:border-current data-[state=on]:bg-current/15',
              category.controlClassName,
            )}
            key={category.key}
            value={category.key}
            variant="outline"
          >
            {`${category.label} (${category.count})`}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
