import type { PropsWithChildren, ReactNode } from 'react'

import { AppFooter } from '@/components/app/app-footer'
import { cn } from '@/lib/utils'

type AppShellSurfaceVariant = 'card' | 'plain'

type AppShellProps = PropsWithChildren<{
  eyebrow?: string
  title: ReactNode
  titleActions?: ReactNode
  description?: string
  actions?: ReactNode
  headerVariant?: AppShellSurfaceVariant
  contentVariant?: AppShellSurfaceVariant
  className?: string
}>

export function AppShell({
  eyebrow,
  title,
  titleActions,
  description,
  actions,
  headerVariant = 'card',
  contentVariant = 'card',
  className,
  children,
}: AppShellProps) {
  return (
    <main className="flex min-h-screen flex-col p-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
        <header
          className={cn(
            headerVariant === 'card'
              ? 'rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-night/20 backdrop-blur sm:p-8'
              : undefined,
          )}
          data-variant={headerVariant}
        >
          <div className={cn(headerVariant === 'card' ? 'flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between' : 'flex items-center justify-between gap-3')}>
            <div className={cn(headerVariant === 'card' ? 'space-y-4' : 'space-y-3')}>
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

            {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
          </div>
        </header>

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
