import type { CategoryMetadata } from '@/features/items/metadata'
import type { Category } from '@/features/items/types'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type CategoryFiltersProps = {
  categories: CategoryMetadata[]
  label: string
  allLabel: string
  value: Category | 'all'
  onValueChange: (value: Category | 'all') => void
}

export function CategoryFilters({
  categories,
  label,
  allLabel,
  value,
  onValueChange,
}: CategoryFiltersProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
        <ToggleGroupItem size="sm" value="all" variant="outline">
          {allLabel}
        </ToggleGroupItem>

        {categories.map((category) => (
          <ToggleGroupItem
            className={cn(
              'border-border/80 data-[state=on]:border-current data-[state=on]:bg-current/15',
              category.key === value ? category.accentClassName : undefined,
            )}
            key={category.key}
            size="sm"
            value={category.key}
            variant="outline"
          >
            {category.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
