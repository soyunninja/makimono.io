import { render, screen, waitFor } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthProvider } from '@/features/auth/pocketbase-auth-provider'
import { FoundationLandingScreen } from '@/features/home/foundation-screen'
import { LocaleProvider } from '@/i18n/locale-provider'

type AuthRecord = { email: string, id: string }
type AuthChangeCallback = (token: string, record: AuthRecord | null) => void

const pocketBaseMock = vi.hoisted(() => ({
  authChangeCallbacks: [] as AuthChangeCallback[],
  client: null as null | {
    authStore: {
      clear: ReturnType<typeof vi.fn>
      isValid: boolean
      model: AuthRecord | null
      onChange: ReturnType<typeof vi.fn>
      record: AuthRecord | null
      token: string
    }
    collection: ReturnType<typeof vi.fn>
  },
  enabled: false,
}))

vi.mock('@/lib/pocketbase', () => ({
  getPocketBaseClient: () => pocketBaseMock.client,
  isPocketBaseEnabled: () => pocketBaseMock.enabled,
}))

let shouldUsePocketBaseAuthProvider = false
let testLocale: 'en' | 'es' = 'en'

function TestRoot() {
  const content = (
    <LocaleProvider initialLocale={testLocale}>
      <Outlet />
    </LocaleProvider>
  )

  if (shouldUsePocketBaseAuthProvider) {
    return <PocketBaseAuthProvider>{content}</PocketBaseAuthProvider>
  }

  return content
}

const rootRoute = createRootRoute({
  component: TestRoot,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FoundationLandingScreen,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => null,
})

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute])

async function renderRoutedHome(options: { locale?: 'en' | 'es', withPocketBaseAuthProvider?: boolean } = {}) {
  shouldUsePocketBaseAuthProvider = options.withPocketBaseAuthProvider ?? false
  testLocale = options.locale ?? 'en'
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/'],
    }),
  })

  await router.load()

  render(<RouterProvider router={router} />)

  return router
}

function authenticatePocketBaseMock() {
  const client = pocketBaseMock.client

  if (!client) {
    throw new Error('PocketBase mock client must be initialized before authentication.')
  }

  pocketBaseMock.enabled = true
  client.authStore.isValid = true
  client.authStore.model = {
    email: 'reader@example.com',
    id: 'user-reader',
  }
  client.authStore.record = client.authStore.model
  client.authStore.token = 'test-token'
}

beforeEach(() => {
  pocketBaseMock.authChangeCallbacks = []
  pocketBaseMock.enabled = false
  pocketBaseMock.client = {
    authStore: {
      clear: vi.fn(),
      isValid: false,
      model: null,
      onChange: vi.fn((callback: AuthChangeCallback) => {
        pocketBaseMock.authChangeCallbacks.push(callback)

        return vi.fn()
      }),
      record: null,
      token: '',
    },
    collection: vi.fn(() => ({
      authWithPassword: vi.fn(),
      create: vi.fn(),
    })),
  }
  shouldUsePocketBaseAuthProvider = false
  testLocale = 'en'
})

describe('FoundationLandingScreen', () => {
  it('renders the localized reviewable root route contract for the first slice in English', async () => {
    await renderRoutedHome({ locale: 'en' })

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Makimono',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('v0.6')).toBeInTheDocument()
    expect(screen.getByText(/personalized suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/list subscriptions/i)).toBeInTheDocument()
  })

  it('renders the localized landing copy in Spanish', async () => {
    await renderRoutedHome({ locale: 'es' })

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Makimono',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('v0.6')).toBeInTheDocument()
    expect(screen.getByText(/listas compartidas/i)).toBeInTheDocument()
  })

  it('redirects an already-authenticated PocketBase user from home to dashboard', async () => {
    authenticatePocketBaseMock()

    const router = await renderRoutedHome({ withPocketBaseAuthProvider: true })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('keeps local mode visits on the home route', async () => {
    const router = await renderRoutedHome({ withPocketBaseAuthProvider: true })

    expect(await screen.findByRole('heading', { level: 1, name: 'Makimono' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
