import { useNavigate } from '@tanstack/react-router'

import { AppFooter } from '@/components/app/app-footer'
import { AppVersion } from '@/components/app/app-version'
import { MakimonoAnimatedLogo } from '@/components/app/makimono-animated-logo'
import { PocketBaseAuthCard } from '@/features/auth/pocketbase-auth-gate'
import { useLocale } from '@/i18n/locale-provider'

const upcomingImprovements = [
  'personalizedSuggestions',
  'listSubscriptions',
  'sharedLists',
  'prioritiesAndReminders',
] as const

export function FoundationLandingScreen() {
  const navigate = useNavigate()
  const { t } = useLocale()

  function handleAuthenticated() {
    void navigate({ to: '/dashboard' })
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 pb-8 pt-24">
      <section className="flex w-full flex-col items-center text-center">
        <div className="grid w-full max-w-[900px] overflow-hidden rounded-[2rem] bg-paper text-paper-foreground shadow-2xl shadow-night/20 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center px-12 py-10">
            <MakimonoAnimatedLogo className="mx-auto" />

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Makimono</h1>

            <p className="mt-3 text-sm font-medium text-paper-foreground/50"><AppVersion /></p>
          </div>

          <div className="flex h-full bg-card p-4 md:p-6">
            <PocketBaseAuthCard className="h-full w-full rounded-none border-0 bg-transparent shadow-none backdrop-blur-none" onAuthenticated={handleAuthenticated} />
          </div>
        </div>

        <div className="mt-10 w-full max-w-[900px] text-left">
          <div className="font-mono">
            <p className="text-sm font-semibold text-foreground">{t('landing.workingOnTitle')}</p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/60">
              {upcomingImprovements.map((improvement) => (
                <li key={improvement}>
                  <span className="text-foreground/40">[ ]</span>
                  {' '}
                  {t(`landing.upcomingImprovements.${improvement}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <AppFooter className="mt-16 w-full max-w-[900px]" />
    </main>
  )
}
