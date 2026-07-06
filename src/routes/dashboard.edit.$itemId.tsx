import { createFileRoute } from '@tanstack/react-router'

import { DashboardEditRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/edit/$itemId')({ component: DashboardEditRoutePage })
