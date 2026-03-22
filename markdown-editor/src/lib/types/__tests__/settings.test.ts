import { describe, it, expect } from 'vitest'
import type { AppSettings, ZennCredentials, MicroCMSCredentials } from '../settings'

describe('Settings types', () => {
  it('AppSettings can be constructed with all required fields', () => {
    const settings: AppSettings = {
      lastWorkspacePath: null,
      recentWorkspaces: [],
      session: null,
      editor: {
        fontSize: 16,
        theme: 'light',
        editorWidth: 720,
        maxTabs: 20,
        autoSave: { mode: 'manual', debounceMs: 1000 },
      },
      plugins: {
        enabled: {},
      },
      platforms: {
        connections: [],
      },
    }
    expect(settings.editor.fontSize).toBe(16)
    expect(settings.editor.theme).toBe('light')
    expect(settings.lastWorkspacePath).toBeNull()
  })

  it('ZennCredentials has required fields', () => {
    const creds: ZennCredentials = {
      type: 'zenn',
      githubToken: 'ghp_xxx',
      repository: 'user/zenn-content',
    }
    expect(creds.type).toBe('zenn')
    expect(creds.githubToken).toBe('ghp_xxx')
  })

  it('MicroCMSCredentials has required fields', () => {
    const creds: MicroCMSCredentials = {
      type: 'microcms',
      serviceDomain: 'my-blog',
      apiKey: 'api-key-123',
    }
    expect(creds.type).toBe('microcms')
  })
})
