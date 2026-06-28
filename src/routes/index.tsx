import { createFileRoute } from '@tanstack/react-router'

import { FoundationLandingScreen } from '@/features/home/foundation-screen'

export const Route = createFileRoute('/')({
  component: FoundationLandingScreen,
})
