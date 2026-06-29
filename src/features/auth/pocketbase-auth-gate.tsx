import { useState, type FormEvent, type PropsWithChildren } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { useLocale } from '@/i18n/locale-provider'
import { getPocketBaseErrorMessage } from '@/lib/pocketbase'

type PocketBaseAuthMode = 'login' | 'register'

function PocketBaseAuthScreen() {
  const { login, register } = useOptionalPocketBaseAuth()
  const { t } = useLocale()
  const [mode, setMode] = useState<PocketBaseAuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
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
      setErrorMessage(getPocketBaseErrorMessage(error, t('auth.errorGeneric')))
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }

  return (
    <AppShell contentVariant={'plain'} description={t('auth.description')} headerVariant={'plain'} title={t('auth.title')}>
      <div className={'mx-auto w-full max-w-md'}>
        <Card>
          <CardHeader className={'space-y-5'}>
            <div className={'flex flex-wrap gap-2'}>
              <Button
                aria-pressed={mode === 'login'}
                onClick={() => setMode('login')}
                type={'button'}
                variant={mode === 'login' ? 'default' : 'outline'}
              >
                {t('auth.loginMode')}
              </Button>
              <Button
                aria-pressed={mode === 'register'}
                onClick={() => setMode('register')}
                type={'button'}
                variant={mode === 'register' ? 'default' : 'outline'}
              >
                {t('auth.registerMode')}
              </Button>
            </div>

            <form className={'space-y-4'} onSubmit={handleSubmit}>
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

              {errorMessage ? <CardDescription className={'text-destructive'}>{errorMessage}</CardDescription> : null}

              <Button className={'w-full'} disabled={isSubmitting} type={'submit'}>
                {mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
              </Button>
            </form>
          </CardHeader>
        </Card>
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
