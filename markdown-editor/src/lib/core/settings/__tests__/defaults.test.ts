import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_CONSTRAINTS } from '../defaults'

describe('DEFAULT_SETTINGS', () => {
  it('has null lastWorkspacePath', () => {
    expect(DEFAULT_SETTINGS.lastWorkspacePath).toBeNull()
  })

  it('has empty recentWorkspaces', () => {
    expect(DEFAULT_SETTINGS.recentWorkspaces).toEqual([])
  })

  it('has correct editor defaults', () => {
    expect(DEFAULT_SETTINGS.editor.fontSize).toBe(16)
    expect(DEFAULT_SETTINGS.editor.theme).toBe('light')
    expect(DEFAULT_SETTINGS.editor.editorWidth).toBe(720)
  })

  it('has 4 platform connections', () => {
    expect(DEFAULT_SETTINGS.platforms.connections).toHaveLength(4)
    const ids = DEFAULT_SETTINGS.platforms.connections.map((c) => c.platformId)
    expect(ids).toContain('zenn')
    expect(ids).toContain('note')
    expect(ids).toContain('microcms')
    expect(ids).toContain('contentful')
  })

  it('all platforms start as not configured', () => {
    DEFAULT_SETTINGS.platforms.connections.forEach((c) => {
      expect(c.isConfigured).toBe(false)
    })
  })
})

describe('SETTINGS_CONSTRAINTS', () => {
  it('fontSize range is 8-48', () => {
    expect(SETTINGS_CONSTRAINTS.fontSize.min).toBe(8)
    expect(SETTINGS_CONSTRAINTS.fontSize.max).toBe(48)
  })

  it('editorWidth range is 400-1200', () => {
    expect(SETTINGS_CONSTRAINTS.editorWidth.min).toBe(400)
    expect(SETTINGS_CONSTRAINTS.editorWidth.max).toBe(1200)
  })

  it('maxRecentWorkspaces is 10', () => {
    expect(SETTINGS_CONSTRAINTS.maxRecentWorkspaces).toBe(10)
  })
})
