import { createFileRoute } from '@tanstack/react-router'

import { handleOAuthToken } from '@/features/oauth/oauth-bridge'

export const Route = createFileRoute('/oauth/token')({
  server: {
    handlers: {
      POST: async ({ request }) => handleOAuthToken(request),
    },
  },
})
