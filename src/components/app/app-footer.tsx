import { cn } from '@/lib/utils'
import { useLocale } from '@/i18n/locale-provider'

type AppFooterProps = {
  className?: string
}

export function AppFooter({ className }: AppFooterProps) {
  const currentYear = new Date().getFullYear()
  const { t } = useLocale()

  return (
    <footer
      className={cn(
        'flex flex-col items-center justify-between gap-4 text-center text-xs leading-6 text-muted-foreground sm:flex-row sm:text-left',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
        <img alt="" aria-hidden="true" className="h-[25px] w-auto object-contain" src="/makimono.png" />
        <span>makimono.io</span>
        <span>©</span>
        <span>{currentYear}</span>
        <span>{t('app.footerRights')}</span>
      </div>

      <p className="max-w-sm text-center sm:text-right">
        {t('app.footerCaboPrefix')}{' '}
        <span
          aria-hidden="true"
          className="mx-1 inline-block size-3 rounded-full bg-accent-yellow align-[-0.125em] shadow-md shadow-accent-yellow/55"
        />
        {' '}{t('app.footerCaboSuffix')}
      </p>
    </footer>
  )
}
