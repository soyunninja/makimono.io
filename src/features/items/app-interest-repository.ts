import { useMemo } from 'react'

import { useOptionalPocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { getAppInterestRepository } from '@/features/items/mock-repository'
import { createPocketBaseInterestRepository } from '@/features/items/pocketbase-repository'

export function useAppInterestRepository() {
  const { client, isAuthenticated, user } = useOptionalPocketBaseAuth()

  return useMemo(() => {
    if (!client || !isAuthenticated || !user) {
      return getAppInterestRepository()
    }

    return createPocketBaseInterestRepository({
      collection: client.collection('interests'),
      userId: user.id,
    })
  }, [client, isAuthenticated, user])
}
