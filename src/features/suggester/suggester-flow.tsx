import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getCategoryMetadata } from '@/features/items/metadata'
import { useLocale } from '@/i18n/locale-provider'

import { cn } from '@/lib/utils'

import {
  getMockRecommendations,
  suggestionMoodOptions,
  suggestionTimeOptions,
  type SuggestionMood,
  type SuggestionTime,
} from '@/features/suggester/mock-recommendations'

type SmartSuggesterFlowProps = {
  isDesktop?: boolean
  onRequestAdd?: () => void
  onRequestClose?: () => void
}

function useDesktopBreakpoint(forcedValue?: boolean) {
  const [isDesktop, setIsDesktop] = useState(forcedValue ?? false)

  useEffect(() => {
    if (typeof forcedValue === 'boolean') {
      setIsDesktop(forcedValue)
      return
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)')

    const syncValue = (matches: boolean) => {
      setIsDesktop(matches)
    }

    syncValue(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      syncValue(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    mediaQuery.addListener(handleChange)

    return () => {
      mediaQuery.removeListener(handleChange)
    }
  }, [forcedValue])

  return isDesktop
}

export function SmartSuggesterFlow({ isDesktop, onRequestAdd, onRequestClose }: SmartSuggesterFlowProps) {
  const { locale, t } = useLocale()
  const resolvedIsDesktop = useDesktopBreakpoint(isDesktop)
  const [selectedTime, setSelectedTime] = useState<SuggestionTime | null>(null)
  const [selectedMood, setSelectedMood] = useState<SuggestionMood | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const recommendations = useMemo(() => {
    if (!hasGenerated || !selectedTime || !selectedMood) {
      return []
    }

    return getMockRecommendations(selectedTime, selectedMood, locale)
  }, [hasGenerated, locale, selectedMood, selectedTime])

  const isGenerateDisabled = !selectedTime || !selectedMood

  const content = (
    <div className="flex max-h-[85vh] flex-col gap-6 overflow-y-auto px-1 pb-1">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('suggester.title')}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t('suggester.description')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-background/40">
          <CardHeader>
            <CardTitle>{t('suggester.timeLabel')}</CardTitle>
            <CardDescription>{t('suggester.timeHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              aria-label={t('suggester.timeLabel')}
              className="flex flex-wrap gap-2"
              onValueChange={(value) => setSelectedTime((value as SuggestionTime) || null)}
              type="single"
              value={selectedTime ?? ''}
            >
              {suggestionTimeOptions.map((timeOption) => (
                <ToggleGroupItem key={timeOption} value={timeOption} variant="outline">
                  {t(`suggester.timeOptions.${timeOption}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card className="bg-background/40">
          <CardHeader>
            <CardTitle>{t('suggester.moodLabel')}</CardTitle>
            <CardDescription>{t('suggester.moodHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              aria-label={t('suggester.moodLabel')}
              className="flex flex-wrap gap-2"
              onValueChange={(value) => setSelectedMood((value as SuggestionMood) || null)}
              type="single"
              value={selectedMood ?? ''}
            >
              {suggestionMoodOptions.map((moodOption) => (
                <ToggleGroupItem key={moodOption} value={moodOption} variant="outline">
                  {t(`suggester.moodOptions.${moodOption}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onRequestClose} type="button" variant="outline">
          {t('suggester.close')}
        </Button>
        <Button disabled={isGenerateDisabled} onClick={() => setHasGenerated(true)} type="button">
          {t('suggester.generate')}
        </Button>
      </div>

      {hasGenerated ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t('suggester.resultsTitle')}</h2>

          <div className="grid gap-4 xl:grid-cols-3">
            {recommendations.map((recommendation) => {
              const metadata = getCategoryMetadata(recommendation.category, locale)

              return (
                <Card className={cn('flex h-full flex-col border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)} key={recommendation.id} role="article">
                  <CardHeader>
                    <div className="space-y-3">
                      <Badge className={metadata.accentClassName} variant="outline">
                        {metadata.label}
                      </Badge>
                      <CardTitle>{recommendation.title}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {t('suggester.reasonLabel')}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">{recommendation.reason}</p>
                    </div>

                    {onRequestAdd ? (
                      <Button className="mt-auto w-full sm:w-auto" onClick={onRequestAdd} type="button">
                        {t('suggester.cta')}
                      </Button>
                    ) : (
                      <Button asChild className="mt-auto w-full sm:w-auto">
                        <a href="/dashboard/add">{t('suggester.cta')}</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )

  if (resolvedIsDesktop) {
    return (
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            onRequestClose?.()
          }
        }}
        open
      >
        <DialogContent className="max-h-[90vh] overflow-hidden" closeLabel={t('app.closeLabel')}>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onRequestClose?.()
        }
      }}
      open
    >
      <SheetContent className="rounded-t-3xl border-x border-t border-border/70" closeLabel={t('app.closeLabel')} side="bottom">
        {content}
      </SheetContent>
    </Sheet>
  )
}
