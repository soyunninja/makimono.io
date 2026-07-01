import { createFileRoute } from '@tanstack/react-router'

import { handleOAuthAuthorize } from '@/features/oauth/oauth-bridge'

export const Route = createFileRoute('/oauth/authorize')({
  server: {
    handlers: {
      GET: async ({ request }) => handleOAuthAuthorize(request),
    },
  },
})
