import { createFileRoute } from '@tanstack/react-router'

import { handleOAuthProtectedResourceMetadata } from '@/features/oauth/oauth-bridge'

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: async ({ request }) => handleOAuthProtectedResourceMetadata(request),
    },
  },
})
