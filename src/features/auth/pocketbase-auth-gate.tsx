import { useState, type FormEvent, type PropsWithChildren } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type PocketBaseAuthMode = 'login' | 'register'

export function PocketBaseAuthCard({ className, onAuthenticated }: { className?: string, onAuthenticated?: () => void }) {
  const { client, isLoading, login, register } = useOptionalPocketBaseAuth()
  const { t } = useLocale()
  const [mode, setMode] = useState<PocketBaseAuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isClientReady = client !== null
  const canSubmit = isClientReady && !isLoading && !isSubmitting
  const submitLabel = mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')
  const submittingLabel = mode === 'login' ? t('auth.submittingLogin') : t('auth.submittingRegister')
  const homeButtonClassName = 'bg-[#FBA87A] text-black hover:bg-[#FBA87A]/90'
  const authModeButtonClassName = 'hover:text-white'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const normalizedEmail = email.trim()

      if (mode === 'login') {
        await login(normalizedEmail, password)
      }
      else {
        await register(normalizedEmail, password)
      }
    }
    catch (error) {
      setErrorMessage(t('auth.errorGeneric'))
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onAuthenticated?.()
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className={'space-y-5'}>
        <div className={'flex flex-wrap gap-2'}>
          <Button
            aria-pressed={mode === 'login'}
            data-state={mode === 'login' ? 'active' : 'inactive'}
            className={mode === 'login' ? cn(homeButtonClassName, authModeButtonClassName, 'ring-2 ring-ring/40 ring-offset-2 ring-offset-background') : authModeButtonClassName}
            onClick={() => setMode('login')}
            type={'button'}
            variant={mode === 'login' ? 'default' : 'outline'}
          >
            {t('auth.loginMode')}
          </Button>
          <Button
            aria-pressed={mode === 'register'}
            data-state={mode === 'register' ? 'active' : 'inactive'}
            className={mode === 'register' ? cn(homeButtonClassName, authModeButtonClassName, 'ring-2 ring-ring/40 ring-offset-2 ring-offset-background') : authModeButtonClassName}
            onClick={() => setMode('register')}
            type={'button'}
            variant={mode === 'register' ? 'default' : 'outline'}
          >
            {t('auth.registerMode')}
          </Button>
        </div>

        <form className={'space-y-4 text-left'} onSubmit={handleSubmit}>
          <div className={'space-y-2'}>
            <Label htmlFor={'pocketbase-auth-email'}>{t('auth.emailLabel')}</Label>
            <Input
              autoComplete={'email'}
              id={'pocketbase-auth-email'}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              type={'email'}
              value={email}
            />
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'pocketbase-auth-password'}>{t('auth.passwordLabel')}</Label>
            <Input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              id={'pocketbase-auth-password'}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              type={'password'}
              value={password}
            />
          </div>

          {!isClientReady ? (
            <CardDescription role={'status'}>{t('auth.readyStatus')}</CardDescription>
          ) : null}

          {errorMessage ? (
            <div aria-live={'assertive'} className={'rounded-2xl border border-[#FBA87A]/40 bg-[#FBA87A]/10 p-4'} role={'alert'}>
              <p className={'text-sm font-semibold text-[#FBA87A]'}>{t('auth.errorTitle')}</p>
              <p className={'mt-1 text-sm leading-6 text-white/80'}>{errorMessage}</p>
            </div>
          ) : null}

          <Button className={cn('w-full', homeButtonClassName)} disabled={!canSubmit} type={'submit'}>
            {isSubmitting || isLoading ? submittingLabel : submitLabel}
          </Button>
        </form>
      </CardHeader>
    </Card>
  )
}

function PocketBaseAuthScreen() {
  const { t } = useLocale()

  return (
    <AppShell contentVariant={'plain'} description={t('auth.description')} headerVariant={'plain'} title={t('auth.title')}>
      <div className={'mx-auto w-full max-w-md'}>
        <PocketBaseAuthCard />
      </div>
    </AppShell>
  )
}

function PocketBaseAuthLoadingScreen() {
  const { t } = useLocale()

  return (
    <AppShell contentVariant={'plain'} headerVariant={'plain'} title={t('auth.loadingTitle')}>
      <div className={'mx-auto w-full max-w-md'}>
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.loadingTitle')}</CardTitle>
            <CardDescription>{t('auth.loadingDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  )
}

export function PocketBaseAuthGate({ children }: PropsWithChildren) {
  const { enabled, isAuthenticated, isLoading } = useOptionalPocketBaseAuth()

  if (!enabled) {
    return children
  }

  if (isLoading) {
    return <PocketBaseAuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <PocketBaseAuthScreen />
  }

  return children
}
