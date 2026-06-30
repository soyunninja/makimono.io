import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

if (typeof window !== 'undefined' && globalThis.CustomEvent !== window.CustomEvent) {
  Object.defineProperty(globalThis, 'CustomEvent', {
    configurable: true,
    value: window.CustomEvent,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
})
