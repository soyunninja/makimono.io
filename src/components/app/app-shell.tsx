import type { PropsWithChildren, ReactNode } from 'react'

import { AppFooter } from '@/components/app/app-footer'
import { AppHeader } from '@/components/app/app-header'
import type { DashboardOverflowMenuView } from '@/components/app/dashboard-overflow-menu'
import type { DashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import { cn } from '@/lib/utils'

type AppShellSurfaceVariant = 'card' | 'plain'

type AppShellProps = PropsWithChildren<{
  appHeaderCreateInterestAction?: {
    href?: string
    label: string
    onClick?: () => void
  }
  appHeaderCurrentView?: DashboardOverflowMenuView
  appHeaderDisplayPreference?: DashboardDisplayPreference
  appHeaderLogoAsHeading?: boolean
  appHeaderLogoLabel?: string
  onAppHeaderDisplayPreferenceChange?: (preference: DashboardDisplayPreference) => void
  eyebrow?: string
  title: ReactNode
  titleActions?: ReactNode
  description?: string
  actions?: ReactNode
  headerVariant?: AppShellSurfaceVariant
  contentVariant?: AppShellSurfaceVariant
  className?: string
  showPageHeader?: boolean
}>

export function AppShell({
  appHeaderCreateInterestAction,
  appHeaderCurrentView,
  appHeaderDisplayPreference,
  appHeaderLogoAsHeading,
  appHeaderLogoLabel = 'Makimono',
  onAppHeaderDisplayPreferenceChange,
  eyebrow,
  title,
  titleActions,
  description,
  actions,
  headerVariant = 'card',
  contentVariant = 'card',
  className,
  showPageHeader = true,
  children,
}: AppShellProps) {
  return (
    <main className="flex min-h-screen flex-col p-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
        <AppHeader
          createInterestAction={appHeaderCreateInterestAction}
          currentView={appHeaderCurrentView}
          displayPreference={appHeaderDisplayPreference}
          logoAsHeading={appHeaderLogoAsHeading}
          logoLabel={appHeaderLogoLabel}
          onDisplayPreferenceChange={onAppHeaderDisplayPreferenceChange}
        />

        {showPageHeader ? (
          <section
            className={cn(
              headerVariant === 'card'
                ? 'rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-night/20 backdrop-blur sm:p-8'
                : undefined,
            )}
            data-variant={headerVariant}
          >
            <div className={cn(headerVariant === 'card' ? 'flex items-start justify-between gap-6' : 'flex items-center justify-between gap-3')}>
              <div className={cn(headerVariant === 'card' ? 'min-w-0 space-y-4' : 'space-y-3')}>
                {eyebrow ? (
                  <span className="inline-flex w-fit items-center rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-purple">
                    {eyebrow}
                  </span>
                ) : null}
                <div className={cn(description ? 'space-y-3' : undefined)}>
                  <div className="flex flex-nowrap items-center gap-3">
                    <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      {title}
                    </h1>
                    {titleActions ? <div className="flex shrink-0 items-center">{titleActions}</div> : null}
                  </div>
                  {description ? (
                    <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
              {actions ? <div className={cn('flex shrink-0 items-center gap-3', headerVariant === 'card' ? 'pt-1' : undefined)}>{actions}</div> : null}
            </div>
          </section>
        ) : null}

        <section
          className={cn(
            contentVariant === 'card'
              ? 'rounded-3xl border border-border/70 bg-card/65 p-6 shadow-xl shadow-night/20 backdrop-blur sm:p-8'
              : 'min-w-0',
            className,
          )}
          data-variant={contentVariant}
        >
          {children}
        </section>
      </div>
      <AppFooter className="mx-auto mt-14 w-full max-w-6xl sm:mt-16" />
    </main>
  )
}
