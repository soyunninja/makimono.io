import type { PropsWithChildren } from 'react'

import { LocaleProvider } from '@/i18n/locale-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return <LocaleProvider>{children}</LocaleProvider>
}
