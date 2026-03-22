import type { AppSettings } from '$lib/types/settings'
import { DEFAULT_SETTINGS, SETTINGS_CONSTRAINTS } from './defaults'

export function mergeWithDefaults(
  partial: Partial<AppSettings>,
  defaults: AppSettings = DEFAULT_SETTINGS,
): AppSettings {
  const merged: AppSettings = {
    lastWorkspacePath: partial.lastWorkspacePath ?? defaults.lastWorkspacePath,
    recentWorkspaces: Array.isArray(partial.recentWorkspaces)
      ? partial.recentWorkspaces.slice(0, SETTINGS_CONSTRAINTS.maxRecentWorkspaces)
      : defaults.recentWorkspaces,
    session: partial.session ?? defaults.session,
    editor: {
      ...defaults.editor,
      ...partial.editor,
    },
    plugins: {
      enabled: {
        ...defaults.plugins.enabled,
        ...partial.plugins?.enabled,
      },
    },
    platforms: {
      connections: partial.platforms?.connections ?? defaults.platforms.connections,
    },
  }

  // Validate constraints
  merged.editor.fontSize = clamp(
    merged.editor.fontSize,
    SETTINGS_CONSTRAINTS.fontSize.min,
    SETTINGS_CONSTRAINTS.fontSize.max,
  )
  merged.editor.editorWidth = clamp(
    merged.editor.editorWidth,
    SETTINGS_CONSTRAINTS.editorWidth.min,
    SETTINGS_CONSTRAINTS.editorWidth.max,
  )
  if (merged.editor.theme !== 'light' && merged.editor.theme !== 'dark') {
    merged.editor.theme = defaults.editor.theme
  }

  return merged
}

function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}
