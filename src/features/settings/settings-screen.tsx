import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { AppVersion } from '@/components/app/app-version'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { LanguageToggle } from '@/components/app/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeAvatarForStorage, type AvatarNormalizationError } from '@/features/auth/avatar-normalization'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { validateUsername, type UpdatePublicProfileInput, type UserPublicProfile, type UsernameValidationError } from '@/features/auth/public-profile'
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

type PublicProfileCardProps = {
  onUpdate: (input: UpdatePublicProfileInput) => Promise<void>
  profile: UserPublicProfile | null
  t: (path: string) => string
}

function PublicProfileCard({ onUpdate, profile, t }: PublicProfileCardProps) {
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarInputFile, setAvatarInputFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const visibleUsername = profile?.username ?? t('settings.profileUsernameFallback')
  const fallbackInitial = visibleUsername.trim().charAt(0).toUpperCase() || 'M'

  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    setAvatarInputFile(event.currentTarget.files?.[0] ?? null)
    setErrorMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const usernameValidation = validateUsername(username)

    if (!usernameValidation.ok) {
      setErrorMessage(t(usernameValidationErrorKey(usernameValidation.error)))
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const normalizedAvatar = avatarInputFile ? await normalizeAvatarForStorage(avatarInputFile) : null

      if (normalizedAvatar && !normalizedAvatar.ok) {
        setErrorMessage(t(avatarNormalizationErrorKey(normalizedAvatar.error)))
        return
      }

      await onUpdate({ avatarFile: normalizedAvatar?.file, username: usernameValidation.username })
      setAvatarInputFile(null)
    }
    catch {
      setErrorMessage(t('settings.profileErrorGeneric'))
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={'md:col-span-2'}>
      <CardHeader className={'text-center'}>
        <CardTitle>{t('settings.profileTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className={'mx-auto flex max-w-md flex-col items-center gap-5'} onSubmit={handleSubmit}>
          <div className={'flex flex-col items-center gap-3 text-center'}>
            {profile?.avatarUrl ? (
              <img alt={t('settings.profileAvatarAlt')} className={'size-24 rounded-full border border-border object-cover'} src={profile.avatarUrl} />
            ) : (
              <div aria-label={t('settings.profileAvatarFallbackLabel')} className={'flex size-24 items-center justify-center rounded-full border border-border bg-muted text-3xl font-semibold text-muted-foreground'} role={'img'}>
                {fallbackInitial}
              </div>
            )}
            <p className={'text-lg font-semibold text-foreground'}>{visibleUsername}</p>
          </div>

          <div className={'w-full space-y-2'}>
            <Label htmlFor={'public-profile-username'}>{t('settings.profileUsernameLabel')}</Label>
            <Input autoComplete={'username'} id={'public-profile-username'} onChange={(event) => setUsername(event.currentTarget.value)} placeholder={t('settings.profileUsernamePlaceholder')} value={username} />
          </div>

          <div className={'w-full space-y-2'}>
            <Label htmlFor={'public-profile-avatar'}>{t('settings.profileAvatarInputLabel')}</Label>
            <Input accept={'image/jpeg,image/png,image/gif,image/webp'} id={'public-profile-avatar'} onChange={handleAvatarChange} type={'file'} />
          </div>

          {errorMessage ? <p className={'text-sm font-medium text-destructive'} role={'alert'}>{errorMessage}</p> : null}

          <Button className={'w-full'} disabled={isSubmitting} type={'submit'}>{t('settings.profileSaveAction')}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function usernameValidationErrorKey(error: UsernameValidationError) {
  return `settings.profileUsernameError.${error}`
}

function avatarNormalizationErrorKey(error: AvatarNormalizationError) {
  return `settings.profileAvatarError.${error}`
}

export function SettingsScreen({ onLoggedOut }: SettingsScreenProps = {}) {
  const { t } = useLocale()
  const { isAuthenticated, logout, publicProfile, updatePublicProfile } = useOptionalPocketBaseAuth()

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
        {isAuthenticated ? <PublicProfileCard onUpdate={updatePublicProfile} profile={publicProfile} t={t} /> : null}

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
