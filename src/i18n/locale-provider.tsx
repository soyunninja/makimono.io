import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { getDictionary, translate, type Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/types'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: Dictionary
  t: (path: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

type LocaleProviderProps = PropsWithChildren<{
  initialLocale?: Locale
}>

export function LocaleProvider({ children, initialLocale = 'en' }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dictionary: getDictionary(locale),
      t: (path: string) => translate(locale, path),
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider')
  }

  return context
}
