import { useCallback, useEffect, useState } from 'react'

export const dashboardDisplayPreferences = ['cards', 'list', 'covers'] as const

export type DashboardDisplayPreference = (typeof dashboardDisplayPreferences)[number]

const dashboardDisplayPreferenceStorageKey = 'meinteresa.dashboardDisplayPreference'
export const publicListDisplayPreferenceStorageKey = 'meinteresa.publicListDisplayPreference'
const defaultDashboardDisplayPreference: DashboardDisplayPreference = 'cards'

export function isDashboardDisplayPreference(value: string): value is DashboardDisplayPreference {
  return dashboardDisplayPreferences.includes(value as DashboardDisplayPreference)
}

export function readDashboardDisplayPreference(storageKey = dashboardDisplayPreferenceStorageKey): DashboardDisplayPreference {
  if (typeof window === 'undefined') {
    return defaultDashboardDisplayPreference
  }

  try {
    const storedPreference = window.localStorage.getItem(storageKey)

    return storedPreference && isDashboardDisplayPreference(storedPreference)
      ? storedPreference
      : defaultDashboardDisplayPreference
  }
  catch {
    return defaultDashboardDisplayPreference
  }
}

export function writeDashboardDisplayPreference(preference: DashboardDisplayPreference, storageKey = dashboardDisplayPreferenceStorageKey) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKey, preference)
  }
  catch {
    // Ignore unavailable storage so the in-memory UI state remains usable.
  }
}

export function useDashboardDisplayPreference(storageKey = dashboardDisplayPreferenceStorageKey) {
  const [preference, setPreferenceState] = useState<DashboardDisplayPreference>(defaultDashboardDisplayPreference)

  useEffect(() => {
    setPreferenceState(readDashboardDisplayPreference(storageKey))

    function handleStorageChange(event: StorageEvent) {
      if (event.key !== storageKey) {
        return
      }

      setPreferenceState(readDashboardDisplayPreference(storageKey))
    }

    window.addEventListener('storage', handleStorageChange)

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [storageKey])

  const setPreference = useCallback((nextPreference: DashboardDisplayPreference) => {
    writeDashboardDisplayPreference(nextPreference, storageKey)
    setPreferenceState(nextPreference)
  }, [storageKey])

  return [preference, setPreference] as const
}
