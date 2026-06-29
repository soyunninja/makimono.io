import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

describe('PocketBase browser runtime dependency', () => {
  it('keeps the official SDK out of app source and dependencies', () => {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const pocketBaseSource = readFileSync(join(projectRoot, 'src/lib/pocketbase.ts'), 'utf8')

    expect(packageJson.dependencies).not.toHaveProperty('pocketbase')
    expect(packageJson.devDependencies).not.toHaveProperty('pocketbase')
    expect(pocketBaseSource).not.toMatch(/from ['"]pocketbase['"]|import\(['"]pocketbase['"]\)/)
    expect(pocketBaseSource).not.toMatch(/\bimport\s*\(/)
  })
})
