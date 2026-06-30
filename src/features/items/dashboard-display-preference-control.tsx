import { Images, LayoutGrid, List, type LucideIcon } from 'lucide-react'

import {
  dashboardDisplayPreferences,
  type DashboardDisplayPreference,
} from '@/features/items/dashboard-display-preference'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

const dashboardDisplayPreferenceLabels: Record<DashboardDisplayPreference, string> = {
  cards: 'settings.dashboardDisplayCards',
  list: 'settings.dashboardDisplayList',
  covers: 'settings.dashboardDisplayCovers',
}

const dashboardDisplayPreferenceIcons: Record<DashboardDisplayPreference, LucideIcon> = {
  cards: LayoutGrid,
  list: List,
  covers: Images,
}

type DashboardDisplayPreferenceControlVariant = 'labeled' | 'icon'

type DashboardDisplayPreferenceControlProps = {
  value: DashboardDisplayPreference
  onChange: (preference: DashboardDisplayPreference) => void
  variant?: DashboardDisplayPreferenceControlVariant
  className?: string
  name?: string
}

export function DashboardDisplayPreferenceControl({
  value,
  onChange,
  variant = 'labeled',
  className,
  name = 'dashboard-display-preference',
}: DashboardDisplayPreferenceControlProps) {
  const { t } = useLocale()
  const isIconOnly = variant === 'icon'

  return (
    <div
      aria-label={t('settings.dashboardDisplayLabel')}
      className={cn('flex flex-wrap justify-start gap-2', className)}
      role={'radiogroup'}
    >
      {dashboardDisplayPreferences.map((preference) => {
        const isSelected = value === preference
        const Icon = dashboardDisplayPreferenceIcons[preference]
        const label = t(dashboardDisplayPreferenceLabels[preference])

        return (
          <label
            className={cn(
              'inline-flex h-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/60',
              isIconOnly ? 'w-9 px-0' : 'px-4 py-2',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
            )}
            key={preference}
            title={label}
          >
            <input
              aria-label={isIconOnly ? label : undefined}
              checked={isSelected}
              className={'sr-only'}
              name={name}
              onChange={() => onChange(preference)}
              type={'radio'}
            />
            <Icon aria-hidden={'true'} className={cn('size-4', isIconOnly ? undefined : 'mr-2')} />
            {isIconOnly ? null : <span>{label}</span>}
          </label>
        )
      })}
    </div>
  )
}
