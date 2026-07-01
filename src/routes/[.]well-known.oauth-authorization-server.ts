import { createFileRoute } from '@tanstack/react-router'

import { handleOAuthAuthorizationServerMetadata } from '@/features/oauth/oauth-bridge'

export const Route = createFileRoute('/.well-known/oauth-authorization-server')({
  server: {
    handlers: {
      GET: async ({ request }) => handleOAuthAuthorizationServerMetadata(request),
    },
  },
})
