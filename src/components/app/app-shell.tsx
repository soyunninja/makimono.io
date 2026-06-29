import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type AppShellSurfaceVariant = 'card' | 'plain'

type AppShellProps = PropsWithChildren<{
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  headerVariant?: AppShellSurfaceVariant
  contentVariant?: AppShellSurfaceVariant
  className?: string
}>

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  headerVariant = 'card',
  contentVariant = 'card',
  className,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header
          className={cn(
            headerVariant === 'card'
              ? 'rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8'
              : undefined,
          )}
          data-variant={headerVariant}
        >
          <div className={cn('flex flex-col gap-6 lg:flex-row lg:justify-between', headerVariant === 'card' ? 'lg:items-end' : 'lg:items-center')}>
            <div className={cn(headerVariant === 'card' ? 'space-y-4' : 'space-y-3')}>
              {eyebrow ? (
                <span className="inline-flex w-fit items-center rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-purple">
                  {eyebrow}
                </span>
              ) : null}
              <div className={cn(description ? 'space-y-3' : undefined)}>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {title}
                </h1>
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
              ? 'rounded-3xl border border-border/70 bg-card/65 p-6 shadow-xl shadow-black/20 backdrop-blur sm:p-8'
              : 'min-w-0',
            className,
          )}
          data-variant={contentVariant}
        >
          {children}
        </section>
      </div>
    </main>
  )
}
