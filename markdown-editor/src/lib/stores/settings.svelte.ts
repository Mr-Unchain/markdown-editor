import type { AppSettings } from '$lib/types/settings'
import { DEFAULT_SETTINGS } from '$lib/core/settings/defaults'

export const appSettings: AppSettings = $state({ ...DEFAULT_SETTINGS })

export function updateAppSettings(partial: Partial<AppSettings>): void {
  Object.assign(appSettings, partial)
}
