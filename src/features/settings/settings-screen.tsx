import { AppShell } from '@/components/app/app-shell'
import { AppVersion } from '@/components/app/app-version'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { LanguageToggle } from '@/components/app/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { useLocale } from '@/i18n/locale-provider'

type SettingsScreenProps = {
  onLoggedOut?: () => void
}

function SettingsLogoTitle({ title }: { title: string }) {
  return (
    <a className={'block h-12 w-48 sm:h-14 sm:w-56'} href={'/dashboard'}>
      <span className={'sr-only'}>{title}</span>
      <img alt={''} aria-hidden={'true'} className={'h-full w-full object-contain object-left'} src={'/makimono.png'} />
    </a>
  )
}

export function SettingsScreen({ onLoggedOut }: SettingsScreenProps = {}) {
  const { t } = useLocale()
  const { isAuthenticated, logout } = useOptionalPocketBaseAuth()

  async function handleLogout() {
    await logout()
    onLoggedOut?.()
  }

  return (
    <AppShell
      actions={(
        <div className={'flex flex-nowrap items-center justify-end gap-3'}>
          <DashboardOverflowMenu currentView={'settings'} />
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={<SettingsLogoTitle title={t('settings.title')} />}
    >
      <div className={'grid gap-4 md:grid-cols-2'}>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.languageTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.sessionTitle')}</CardTitle>
          </CardHeader>
          {isAuthenticated ? (
            <CardContent>
              <Button onClick={() => void handleLogout()} type={'button'} variant={'outline'}>
                {t('auth.logoutAction')}
              </Button>
            </CardContent>
          ) : null}
        </Card>

        <Card className={'md:col-span-2'}>
          <CardHeader>
            <CardTitle>{t('settings.versionTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={'text-2xl font-semibold text-foreground'}><AppVersion /></p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
