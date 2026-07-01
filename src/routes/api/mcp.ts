import { createFileRoute } from '@tanstack/react-router'

import { handleRemoteMcpRequest } from '@/features/mcp/remote-mcp'

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) => handleRemoteMcpRequest(request),
    },
  },
})
