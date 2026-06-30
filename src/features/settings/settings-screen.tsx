import { AppShell } from '@/components/app/app-shell'
import { AppVersion } from '@/components/app/app-version'
import { LanguageToggle } from '@/components/app/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { DashboardDisplayPreferenceControl } from '@/features/items/dashboard-display-preference-control'
import { useDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import { useLocale } from '@/i18n/locale-provider'

type SettingsScreenProps = {
  onLoggedOut?: () => void
}

export function SettingsScreen({ onLoggedOut }: SettingsScreenProps = {}) {
  const { t } = useLocale()
  const { isAuthenticated, logout } = useOptionalPocketBaseAuth()
  const [dashboardDisplayPreference, setDashboardDisplayPreference] = useDashboardDisplayPreference()

  async function handleLogout() {
    await logout()
    onLoggedOut?.()
  }

  return (
    <AppShell
      actions={(
        <Button asChild variant={'outline'}>
          <a href={'/dashboard'}>{t('settings.backAction')}</a>
        </Button>
      )}
      contentVariant={'plain'}
      description={t('settings.description')}
      headerVariant={'plain'}
      title={t('settings.title')}
    >
      <div className={'grid gap-4 md:grid-cols-2'}>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.languageTitle')}</CardTitle>
            <CardDescription>{t('settings.languageDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.dashboardDisplayTitle')}</CardTitle>
            <CardDescription>{t('settings.dashboardDisplayDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardDisplayPreferenceControl
              onChange={setDashboardDisplayPreference}
              value={dashboardDisplayPreference}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.sessionTitle')}</CardTitle>
            <CardDescription>{t('settings.sessionDescription')}</CardDescription>
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
            <CardDescription>{t('settings.versionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={'text-2xl font-semibold text-foreground'}><AppVersion /></p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
