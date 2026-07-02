import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  mapAuthRecordToUserPublicProfile,
  normalizeUsername,
  type UpdatePublicProfileInput,
  type UserPublicProfile,
} from '@/features/auth/public-profile'
import {
  getPocketBaseFileUrl,
  getPocketBaseClient,
  isPocketBaseAuthRecord,
  isPocketBaseEnabled,
  type PocketBaseAuthRecord,
} from '@/lib/pocketbase'

type PocketBaseAuthContextValue = {
  client: ReturnType<typeof getPocketBaseClient>
  enabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  publicProfile: UserPublicProfile | null
  user: PocketBaseAuthRecord | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updatePublicProfile: (input: UpdatePublicProfileInput) => Promise<void>
}

const disabledAuthError = new Error('PocketBase auth is not configured.')

const disabledAuthContextValue: PocketBaseAuthContextValue = {
  client: null,
  enabled: false,
  isAuthenticated: false,
  isLoading: false,
  publicProfile: null,
  user: null,
  async login() {
    throw disabledAuthError
  },
  async register() {
    throw disabledAuthError
  },
  async logout() {},
  async updatePublicProfile() {
    throw disabledAuthError
  },
}

const PocketBaseAuthContext = createContext<PocketBaseAuthContextValue | null>(null)

function resolveAuthenticatedUser(token: string, isValid: boolean, record: PocketBaseAuthRecord | null) {
  return token && isValid && record ? record : null
}

function resolvePublicProfile(record: PocketBaseAuthRecord | null) {
  return mapAuthRecordToUserPublicProfile(record, {
    resolveAvatarUrl: (avatarFileName) => (record ? getPocketBaseFileUrl('users', record.id, avatarFileName) : null),
  })
}

export function PocketBaseAuthProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<ReturnType<typeof getPocketBaseClient>>(null)
  const [enabled, setEnabled] = useState(() => isPocketBaseEnabled())
  const [user, setUser] = useState<PocketBaseAuthRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const nextEnabled = isPocketBaseEnabled()
    const nextClient = getPocketBaseClient()

    setEnabled(nextEnabled)
    setClient(nextClient)

    if (!nextEnabled || !nextClient) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const unsubscribe = nextClient.authStore.onChange((token, model) => {
      setUser(resolveAuthenticatedUser(token, nextClient.authStore.isValid, model))
      setIsLoading(false)
    })

    setUser(resolveAuthenticatedUser(nextClient.authStore.token, nextClient.authStore.isValid, nextClient.authStore.model))
    setIsLoading(false)

    return () => {
      unsubscribe()
    }
  }, [])

  const value = useMemo<PocketBaseAuthContextValue>(
    () => ({
      client,
      enabled,
      isAuthenticated: user !== null,
      isLoading,
      publicProfile: resolvePublicProfile(user),
      user,
      async login(email: string, password: string) {
        if (!client) {
          throw disabledAuthError
        }

        setIsLoading(true)

        try {
          await client.collection('users').authWithPassword(email, password)
        }
        catch (error) {
          setIsLoading(false)
          throw error
        }
      },
      async register(email: string, password: string) {
        if (!client) {
          throw disabledAuthError
        }

        setIsLoading(true)

        try {
          await client.collection('users').create({
            email,
            password,
            passwordConfirm: password,
          })
          await client.collection('users').authWithPassword(email, password)
        }
        catch (error) {
          setIsLoading(false)
          throw error
        }
      },
      async logout() {
        client?.authStore.clear()
        setUser(null)
        setIsLoading(false)
      },
      async updatePublicProfile(input: UpdatePublicProfileInput) {
        if (!client || !user) {
          throw disabledAuthError
        }

        const formData = new FormData()
        formData.set('username', normalizeUsername(input.username))

        if (input.avatarFile) {
          formData.set('avatar', input.avatarFile)
        }

        const updatedRecord = await client.collection('users').update(user.id, formData)

        if (!isPocketBaseAuthRecord(updatedRecord)) {
          throw new Error('Invalid PocketBase profile update response.')
        }

        client.authStore.save(client.authStore.token, updatedRecord)
        setUser(updatedRecord)
      },
    }),
    [client, enabled, isLoading, user],
  )

  return <PocketBaseAuthContext.Provider value={value}>{children}</PocketBaseAuthContext.Provider>
}

export function usePocketBaseAuth() {
  const context = useContext(PocketBaseAuthContext)

  if (!context) {
    throw new Error('usePocketBaseAuth must be used inside PocketBaseAuthProvider')
  }

  return context
}

export function useOptionalPocketBaseAuth() {
  return useContext(PocketBaseAuthContext) ?? disabledAuthContextValue
}
