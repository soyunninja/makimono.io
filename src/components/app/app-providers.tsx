import type { PropsWithChildren } from 'react'

import { PocketBaseAuthProvider } from '@/features/auth/pocketbase-auth-provider'
import { LocaleProvider } from '@/i18n/locale-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LocaleProvider>
      <PocketBaseAuthProvider>{children}</PocketBaseAuthProvider>
    </LocaleProvider>
  )
}
