import type { AppSettings } from '$lib/types/settings'

export const DEFAULT_SETTINGS: AppSettings = {
  lastWorkspacePath: null,
  recentWorkspaces: [],
  editor: {
    fontSize: 16,
    theme: 'light',
    editorWidth: 720,
  },
  plugins: {
    enabled: {},
  },
  platforms: {
    connections: [
      { platformId: 'zenn', displayName: 'Zenn', isConfigured: false },
      { platformId: 'note', displayName: 'note', isConfigured: false },
      { platformId: 'microcms', displayName: 'microCMS', isConfigured: false },
      { platformId: 'contentful', displayName: 'Contentful', isConfigured: false },
    ],
  },
}

export const SETTINGS_CONSTRAINTS = {
  fontSize: { min: 8, max: 48 },
  editorWidth: { min: 400, max: 1200 },
  maxRecentWorkspaces: 10,
} as const
