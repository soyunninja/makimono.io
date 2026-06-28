import { AppShell } from '@/components/app/app-shell'
import { useLocale } from '@/i18n/locale-provider'

const milestoneKeys = ['scaffold', 'theme', 'baseline'] as const

export function FoundationLandingScreen() {
  const { dictionary } = useLocale()
  const { app, landing } = dictionary

  return (
    <AppShell eyebrow={app.foundationStatus} description={landing.description} title={landing.title}>
      <div className="grid gap-4 md:grid-cols-3">
        {milestoneKeys.map((milestoneKey) => {
          const milestone = landing.milestones[milestoneKey]

          return (
            <article
              className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-lg shadow-black/10"
              key={milestoneKey}
            >
              <h2 className="text-xl font-semibold text-foreground">{milestone.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{milestone.description}</p>
            </article>
          )
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-accent-purple/20 bg-accent-purple/10 p-5">
        <h2 className="text-xl font-semibold text-foreground">{landing.nextTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{landing.nextDescription}</p>
      </div>
    </AppShell>
  )
}
