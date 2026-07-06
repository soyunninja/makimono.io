import { Plus } from 'lucide-react'

import { DashboardOverflowMenu, type DashboardOverflowMenuView } from '@/components/app/dashboard-overflow-menu'
import { Button } from '@/components/ui/button'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { DashboardDisplayPreferenceControl } from '@/features/items/dashboard-display-preference-control'
import { type DashboardDisplayPreference, useDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

type AppHeaderCreateInterestAction = {
  href?: string
  label: string
  onClick?: () => void
}

type AppHeaderProps = {
  createInterestAction?: AppHeaderCreateInterestAction
  currentView?: DashboardOverflowMenuView
  displayPreference?: DashboardDisplayPreference
  logoAsHeading?: boolean
  logoLabel: string
  onDisplayPreferenceChange?: (preference: DashboardDisplayPreference) => void
}

const appHeaderLogoSources = {
  cards: '/tarjetas.png',
  list: '/listado.png',
  covers: '/caratula.png',
} satisfies Record<DashboardDisplayPreference, string>

export function AppHeader({
  createInterestAction,
  currentView,
  displayPreference: controlledDisplayPreference,
  logoAsHeading = false,
  logoLabel,
  onDisplayPreferenceChange,
}: AppHeaderProps) {
  const { t } = useLocale()
  const { isAuthenticated, publicProfile, user } = useOptionalPocketBaseAuth()
  const [storedDisplayPreference, setStoredDisplayPreference] = useDashboardDisplayPreference()
  const displayPreference = controlledDisplayPreference ?? storedDisplayPreference
  const setDisplayPreference = onDisplayPreferenceChange ?? setStoredDisplayPreference
  const profileAvatarLabel = t('dashboard.profileAvatarLabel')
  const username = publicProfile?.username ?? (typeof user?.username === 'string' ? user.username : '')
  const logoPreference = isAuthenticated ? displayPreference : 'covers'
  const logo = <AppHeaderLogo preference={logoPreference} title={logoLabel} />
  const showDisplayPreferenceControl = currentView === 'dashboard'

  return (
    <header className={'flex items-center justify-between gap-3'}>
      <a className={'flex min-w-0 shrink-0 items-center'} href={'/dashboard'}>
        {logoAsHeading ? <h1 className={'text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl'}>{logo}</h1> : logo}
      </a>

      {isAuthenticated ? (
        <div className={'flex min-w-0 flex-1 items-center justify-between gap-2'}>
          {showDisplayPreferenceControl ? (
            <DashboardDisplayPreferenceControl
              className={'-ml-1 gap-1 sm:ml-0 sm:gap-2'}
              name={'dashboard-display-preference-header'}
              onChange={setDisplayPreference}
              value={displayPreference}
              variant={'icon'}
            />
          ) : <span aria-hidden={'true'} />}
          <div className={'flex flex-nowrap items-center justify-end gap-2 sm:gap-3'}>
            {createInterestAction ? <CreateInterestButton action={createInterestAction} /> : null}
            {publicProfile || username ? (
              <AppHeaderAvatar
                avatarUrl={publicProfile?.avatarUrl ?? null}
                label={profileAvatarLabel}
                username={username}
              />
            ) : null}
            {currentView ? <DashboardOverflowMenu /> : null}
          </div>
        </div>
      ) : (
        <div className={'flex min-w-0 flex-1 items-center justify-end'}>
          <Button asChild variant={'outline'}>
            <a href={'/?auth=register'}>{t('auth.registerHeaderAction')}</a>
          </Button>
        </div>
      )}
    </header>
  )
}

function CreateInterestButton({ action }: { action: AppHeaderCreateInterestAction }) {
  const className = 'size-9 bg-brand-sun text-night hover:bg-brand-sun/90 sm:size-11 [&_svg]:size-5 sm:[&_svg]:size-6'

  if (action.onClick) {
    return (
      <Button className={className} onClick={action.onClick} size={'icon'} type={'button'}>
        <Plus aria-hidden={'true'} className={'size-5 sm:size-6'} />
        <span className={'sr-only'}>{action.label}</span>
      </Button>
    )
  }

  return (
    <Button asChild className={className} size={'icon'}>
      <a href={action.href ?? '/dashboard/add'} title={action.label}>
        <Plus aria-hidden={'true'} className={'size-5 sm:size-6'} />
        <span className={'sr-only'}>{action.label}</span>
      </a>
    </Button>
  )
}

function AppHeaderLogo({ preference, title }: { preference: DashboardDisplayPreference, title: string }) {
  return (
    <span className={'relative block h-11 w-11 sm:h-14 sm:w-14'}>
      <span className={'sr-only'}>{title}</span>
      {Object.entries(appHeaderLogoSources).map(([logoPreference, src]) => (
        <img
          alt={''}
          aria-hidden={'true'}
          className={cn(
            'absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-300 ease-in-out',
            preference === logoPreference ? 'opacity-100' : 'opacity-0',
          )}
          key={logoPreference}
          src={src}
        />
      ))}
    </span>
  )
}

function AppHeaderAvatar({ avatarUrl, label, username }: { avatarUrl: string | null, label: string, username: string }) {
  if (avatarUrl) {
    return (
      <img
        alt={label}
        className={'size-9 rounded-full border border-white/20 bg-white/10 object-cover sm:size-11'}
        src={avatarUrl}
        title={label}
      />
    )
  }

  const fallbackInitial = username.trim().charAt(0).toUpperCase()

  if (!fallbackInitial) {
    return null
  }

  return (
    <span
      aria-label={label}
      className={'flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white sm:size-11 sm:text-base'}
      role={'img'}
      title={label}
    >
      {fallbackInitial}
    </span>
  )
}
