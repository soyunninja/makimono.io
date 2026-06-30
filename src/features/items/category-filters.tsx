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
  className?: string
  containerClassName?: string
}

export function CategoryFilters({
  categories,
  label,
  allLabel,
  totalCount,
  value,
  onValueChange,
  className,
  containerClassName,
}: CategoryFiltersProps) {
  return (
    <div className={cn('min-w-0', containerClassName)}>
      <ToggleGroup
        aria-label={label}
        className={cn('flex flex-wrap justify-start gap-2', className)}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue as Category | 'all')
          }
        }}
        type="single"
        value={value}
      >
        <ToggleGroupItem className="cursor-pointer" value="all" variant="outline">
          {`${allLabel} (${totalCount})`}
        </ToggleGroupItem>

        {categories.map((category) => (
          <ToggleGroupItem
            className={cn(
              'cursor-pointer data-[state=on]:border-current data-[state=on]:bg-current/15',
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
