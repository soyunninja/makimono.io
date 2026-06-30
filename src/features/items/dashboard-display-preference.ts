import { useCallback, useEffect, useState } from 'react'

export const dashboardDisplayPreferences = ['cards', 'list', 'covers'] as const

export type DashboardDisplayPreference = (typeof dashboardDisplayPreferences)[number]

const dashboardDisplayPreferenceStorageKey = 'meinteresa.dashboardDisplayPreference'
const defaultDashboardDisplayPreference: DashboardDisplayPreference = 'cards'

export function isDashboardDisplayPreference(value: string): value is DashboardDisplayPreference {
  return dashboardDisplayPreferences.includes(value as DashboardDisplayPreference)
}

export function readDashboardDisplayPreference(): DashboardDisplayPreference {
  if (typeof window === 'undefined') {
    return defaultDashboardDisplayPreference
  }

  try {
    const storedPreference = window.localStorage.getItem(dashboardDisplayPreferenceStorageKey)

    return storedPreference && isDashboardDisplayPreference(storedPreference)
      ? storedPreference
      : defaultDashboardDisplayPreference
  }
  catch {
    return defaultDashboardDisplayPreference
  }
}

export function writeDashboardDisplayPreference(preference: DashboardDisplayPreference) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(dashboardDisplayPreferenceStorageKey, preference)
  }
  catch {
    // Ignore unavailable storage so the in-memory UI state remains usable.
  }
}

export function useDashboardDisplayPreference() {
  const [preference, setPreferenceState] = useState<DashboardDisplayPreference>(() => readDashboardDisplayPreference())

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== dashboardDisplayPreferenceStorageKey) {
        return
      }

      setPreferenceState(readDashboardDisplayPreference())
    }

    window.addEventListener('storage', handleStorageChange)

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setPreference = useCallback((nextPreference: DashboardDisplayPreference) => {
    writeDashboardDisplayPreference(nextPreference)
    setPreferenceState(nextPreference)
  }, [])

  return [preference, setPreference] as const
}
