import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/app-shell'
import { DashboardOverflowMenu } from '@/components/app/dashboard-overflow-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { useLocale } from '@/i18n/locale-provider'
import { getPocketBaseClient } from '@/lib/pocketbase'

export type McpAuditEvent = {
  id: string
  action: string
  created: string
  outcome: string
  summary?: unknown
  targetId?: string
  toolName: string
}

export type McpAuditRepository = {
  listEvents: () => Promise<McpAuditEvent[]>
}

type McpAuditScreenProps = {
  repository?: McpAuditRepository
}

type McpAuditCollection = {
  getFullList: (options?: { limit?: number, perPage?: number, sort?: string }) => Promise<unknown[]>
}

const auditCollectionName = 'remote_mcp_audit_events'
const auditEventLimit = 50
const hasOwn = Object.prototype.hasOwnProperty

function McpAuditLogoTitle({ title }: { title: string }) {
  return (
    <a className={'block h-12 w-48 sm:h-14 sm:w-56'} href={'/dashboard'}>
      <span className={'sr-only'}>{title}</span>
      <img alt={''} aria-hidden={'true'} className={'h-full w-full object-contain object-left'} src={'/makimono.png'} />
    </a>
  )
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readOptionalString(record: Record<string, unknown>, field: string) {
  return hasOwn.call(record, field) && isString(record[field]) && record[field].trim().length > 0 ? record[field] : undefined
}

function mapMcpAuditEvent(record: unknown): McpAuditEvent {
  if (!isRecord(record)) {
    throw new Error('Invalid MCP audit event record.')
  }

  const id = readOptionalString(record, 'id')
  const created = readOptionalString(record, 'created')
  const toolName = readOptionalString(record, 'toolName')
  const action = readOptionalString(record, 'action')
  const outcome = readOptionalString(record, 'outcome')

  if (!id || !created || !toolName || !action || !outcome) {
    throw new Error('MCP audit event record is missing required fields.')
  }

  return {
    id,
    action,
    created,
    outcome,
    summary: hasOwn.call(record, 'summary') ? record.summary : undefined,
    targetId: readOptionalString(record, 'targetId'),
    toolName,
  }
}

function formatSummary(summary: unknown) {
  if (summary === undefined || summary === null || summary === '') {
    return null
  }

  if (isString(summary)) {
    return summary
  }

  return JSON.stringify(summary, null, 2)
}

function getSearchableAuditText(event: McpAuditEvent) {
  return [
    event.targetId,
    event.toolName,
    event.action,
    event.outcome,
    formatSummary(event.summary),
  ]
    .filter(isString)
    .join(' ')
    .toLowerCase()
}

function createPocketBaseMcpAuditRepository(client: ReturnType<typeof getPocketBaseClient>): McpAuditRepository | null {
  if (!client) {
    return null
  }

  const collection = client.collection(auditCollectionName) as McpAuditCollection

  return {
    async listEvents() {
      return (await collection.getFullList({ limit: auditEventLimit, perPage: auditEventLimit, sort: '-created' })).map(mapMcpAuditEvent)
    },
  }
}

export function McpAuditScreen({ repository }: McpAuditScreenProps = {}) {
  const { client } = useOptionalPocketBaseAuth()
  const { t } = useLocale()
  const [events, setEvents] = useState<McpAuditEvent[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const auditRepository = useMemo(
    () => repository ?? createPocketBaseMcpAuditRepository(client),
    [client, repository],
  )
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredEvents = useMemo(
    () => normalizedSearchQuery.length === 0
      ? events
      : events.filter((event) => getSearchableAuditText(event).includes(normalizedSearchQuery)),
    [events, normalizedSearchQuery],
  )

  useEffect(() => {
    let isCurrent = true

    async function loadEvents() {
      setIsLoading(true)
      setErrorMessage(null)

      if (!auditRepository) {
        setEvents([])
        setIsLoading(false)
        return
      }

      try {
        const nextEvents = await auditRepository.listEvents()

        if (isCurrent) {
          setEvents(nextEvents)
        }
      }
      catch {
        if (isCurrent) {
          setEvents([])
          setErrorMessage(t('mcpAudit.errorDescription'))
        }
      }
      finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isCurrent = false
    }
  }, [auditRepository, t])

  return (
    <AppShell
      actions={(
        <div className={'flex flex-nowrap items-center justify-end gap-3'}>
          <DashboardOverflowMenu currentView={'audit'} />
        </div>
      )}
      contentVariant={'plain'}
      headerVariant={'plain'}
      title={<McpAuditLogoTitle title={t('mcpAudit.title')} />}
    >
      <div className={'space-y-4'}>
        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('mcpAudit.loading')}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && errorMessage ? (
          <Card role={'alert'}>
            <CardHeader>
              <CardTitle>{t('mcpAudit.errorTitle')}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && events.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('mcpAudit.emptyTitle')}</CardTitle>
              <CardDescription>{t('mcpAudit.emptyDescription')}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && events.length > 0 ? (
          <div className={'space-y-3'}>
            <Card>
              <CardHeader>
                <CardTitle>{t('mcpAudit.searchTitle')}</CardTitle>
                <CardDescription>{t('mcpAudit.searchDescription')}</CardDescription>
              </CardHeader>
              <CardContent className={'space-y-2'}>
                <Input
                  aria-label={t('mcpAudit.searchLabel')}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('mcpAudit.searchPlaceholder')}
                  value={searchQuery}
                />
                <p className={'text-sm text-muted-foreground'}>{filteredEvents.length} / {events.length} {t('mcpAudit.resultCountSuffix')}</p>
              </CardContent>
            </Card>

            {filteredEvents.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('mcpAudit.emptySearchTitle')}</CardTitle>
                  <CardDescription>{t('mcpAudit.emptySearchDescription')}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {filteredEvents.map((event) => {
              const summaryText = formatSummary(event.summary)

              return (
                <Card key={event.id} role={'article'}>
                  <CardHeader>
                    <CardTitle>{event.toolName}</CardTitle>
                    <CardDescription>{event.created}</CardDescription>
                  </CardHeader>
                  <CardContent className={'space-y-3 text-sm'}>
                    <dl className={'grid gap-2 sm:grid-cols-3'}>
                      <div>
                        <dt className={'font-semibold text-muted-foreground'}>{t('mcpAudit.actionLabel')}</dt>
                        <dd>{event.action}</dd>
                      </div>
                      <div>
                        <dt className={'font-semibold text-muted-foreground'}>{t('mcpAudit.outcomeLabel')}</dt>
                        <dd>{event.outcome}</dd>
                      </div>
                      <div>
                        <dt className={'font-semibold text-muted-foreground'}>{t('mcpAudit.targetIdLabel')}</dt>
                        <dd>{event.targetId ?? t('mcpAudit.emptyValue')}</dd>
                      </div>
                    </dl>
                    {summaryText ? (
                      <pre className={'overflow-x-auto whitespace-pre-wrap rounded-2xl bg-background/50 p-3 text-xs leading-5 text-muted-foreground'}>{summaryText}</pre>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
