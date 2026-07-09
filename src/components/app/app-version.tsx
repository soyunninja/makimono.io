import packageJson from '../../../package.json'

export const appVersion = `v${packageJson.version}`

export function AppVersion() {
  return <span>{appVersion}</span>
}
