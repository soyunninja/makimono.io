import { Box, EllipsisVertical, ScrollText, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLocale } from '@/i18n/locale-provider'

type DashboardOverflowMenuView = 'archive' | 'audit' | 'dashboard' | 'settings'

type DashboardOverflowMenuProps = {
  currentView: DashboardOverflowMenuView
}

type DashboardOverflowMenuItem = {
  href: string
  key: Exclude<DashboardOverflowMenuView, 'dashboard'>
  label: string
}

function DashboardOverflowMenuIcon({ itemKey }: { itemKey: DashboardOverflowMenuItem['key'] }) {
  if (itemKey === 'archive') {
    return <Box aria-hidden={'true'} />
  }

  if (itemKey === 'audit') {
    return <ScrollText aria-hidden={'true'} />
  }

  return <Settings aria-hidden={'true'} />
}

export function DashboardOverflowMenu({ currentView }: DashboardOverflowMenuProps) {
  const { t } = useLocale()
  const menuItems: DashboardOverflowMenuItem[] = [
    {
      href: '/dashboard/archive',
      key: 'archive',
      label: t('dashboard.archiveAction'),
    },
    {
      href: '/dashboard/audit',
      key: 'audit',
      label: t('dashboard.auditAction'),
    },
    {
      href: '/dashboard/settings',
      key: 'settings',
      label: t('dashboard.settingsAction'),
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t('dashboard.moreActions')} className={'size-9 text-white/80 hover:text-white sm:size-11'} size={'icon'} type={'button'} variant={'outline'}>
          <EllipsisVertical aria-hidden={'true'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={'end'}>
        {menuItems
          .filter((item) => item.key !== currentView)
          .map((item) => (
            <DropdownMenuItem asChild key={item.key}>
              <a href={item.href}>
                <DashboardOverflowMenuIcon itemKey={item.key} />
                {item.label}
              </a>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
