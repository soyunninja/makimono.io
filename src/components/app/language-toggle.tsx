import { Button } from '@/components/ui/button'
import { useLocale } from '@/i18n/locale-provider'
import type { Locale } from '@/i18n/types'

const localeOptions: Locale[] = ['en', 'es']

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      aria-label={t('app.languageLabel')}
      className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-1"
      role="group"
    >
      {localeOptions.map((nextLocale) => (
        <Button
          aria-pressed={locale === nextLocale}
          key={nextLocale}
          onClick={() => setLocale(nextLocale)}
          type="button"
          variant={locale === nextLocale ? 'default' : 'ghost'}
        >
          {nextLocale.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
