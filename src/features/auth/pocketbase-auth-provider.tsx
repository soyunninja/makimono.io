import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  getPocketBaseClient,
  isPocketBaseEnabled,
  type PocketBaseAuthRecord,
} from '@/lib/pocketbase'

type PocketBaseAuthContextValue = {
  client: ReturnType<typeof getPocketBaseClient>
  enabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  user: PocketBaseAuthRecord | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const disabledAuthError = new Error('PocketBase auth is not configured.')

const disabledAuthContextValue: PocketBaseAuthContextValue = {
  client: null,
  enabled: false,
  isAuthenticated: false,
  isLoading: false,
  user: null,
  async login() {
    throw disabledAuthError
  },
  async register() {
    throw disabledAuthError
  },
  async logout() {},
}

const PocketBaseAuthContext = createContext<PocketBaseAuthContextValue | null>(null)

function resolveAuthenticatedUser(token: string, isValid: boolean, record: PocketBaseAuthRecord | null) {
  return token && isValid && record ? record : null
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
