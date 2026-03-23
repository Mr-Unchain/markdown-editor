import type { SessionState, RecentWorkspace, AutoSaveConfig } from './workspace'

export interface AppSettings {
  lastWorkspacePath: string | null
  recentWorkspaces: RecentWorkspace[]
  session: SessionState | null
  editor: EditorSettings
  plugins: PluginConfig
  platforms: PlatformConnectionConfig
}

export interface EditorSettings {
  fontSize: number
  theme: 'light' | 'dark'
  editorWidth: number
  maxTabs: number
  autoSave: AutoSaveConfig
}

export interface PluginConfig {
  enabled: Record<string, boolean>
}

export interface PlatformConnectionConfig {
  connections: PlatformConnection[]
}

export interface PlatformConnection {
  platformId: string
  displayName: string
  isConfigured: boolean
}

export type PlatformCredentials =
  | ZennCredentials
  | NoteCredentials
  | MicroCMSCredentials
  | ContentfulCredentials

export interface ZennCredentials {
  type: 'zenn'
  githubToken: string
  repository: string
  repositoryOwner: string
  repositoryName: string
  branch: string
}

export interface NoteCredentials {
  type: 'note'
  accessToken: string
}

export interface MicroCMSCredentials {
  type: 'microcms'
  serviceDomain: string
  apiKey: string
}

export interface ContentfulCredentials {
  type: 'contentful'
  spaceId: string
  accessToken: string
  environmentId: string
}
