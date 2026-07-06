import { Box, EllipsisVertical, List, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLocale } from '@/i18n/locale-provider'

export type DashboardOverflowMenuView = 'archive' | 'audit' | 'dashboard' | 'publicLists' | 'settings'

type DashboardOverflowMenuItem = {
  href: string
  key: DashboardOverflowMenuView
  label: string
}

function DashboardOverflowMenuIcon({ itemKey }: { itemKey: DashboardOverflowMenuItem['key'] }) {
  if (itemKey === 'archive') {
    return <Box aria-hidden={'true'} />
  }

  if (itemKey === 'publicLists') {
    return <List aria-hidden={'true'} />
  }

  return <Settings aria-hidden={'true'} />
}

export function DashboardOverflowMenu() {
  const { t } = useLocale()
  const menuItems: DashboardOverflowMenuItem[] = [
    {
      href: '/dashboard/archive',
      key: 'archive',
      label: t('dashboard.archiveAction'),
    },
    {
      href: '/dashboard/public-lists',
      key: 'publicLists',
      label: t('dashboard.publicListsAction'),
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
        {menuItems.map((item) => (
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
