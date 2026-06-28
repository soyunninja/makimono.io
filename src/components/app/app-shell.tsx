import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type AppShellProps = PropsWithChildren<{
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}>

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex w-fit items-center rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-purple">
                {eyebrow}
              </span>
              <div className="space-y-3">
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
          </div>
        </header>

        <section
          className={cn(
            'rounded-3xl border border-border/70 bg-card/65 p-6 shadow-xl shadow-black/20 backdrop-blur sm:p-8',
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  )
}
