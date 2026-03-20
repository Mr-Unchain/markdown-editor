import { describe, it, expect } from 'vitest'
import { mergeWithDefaults } from '../merge'
import { DEFAULT_SETTINGS } from '../defaults'

describe('mergeWithDefaults', () => {
  it('returns defaults when given empty object', () => {
    const result = mergeWithDefaults({})
    expect(result.editor.fontSize).toBe(DEFAULT_SETTINGS.editor.fontSize)
    expect(result.editor.theme).toBe(DEFAULT_SETTINGS.editor.theme)
  })

  it('preserves valid partial settings', () => {
    const result = mergeWithDefaults({
      editor: { fontSize: 20, theme: 'dark', editorWidth: 800 },
    })
    expect(result.editor.fontSize).toBe(20)
    expect(result.editor.theme).toBe('dark')
    expect(result.editor.editorWidth).toBe(800)
  })

  it('clamps fontSize to min', () => {
    const result = mergeWithDefaults({
      editor: { fontSize: 2, theme: 'light', editorWidth: 720 },
    })
    expect(result.editor.fontSize).toBe(8)
  })

  it('clamps fontSize to max', () => {
    const result = mergeWithDefaults({
      editor: { fontSize: 100, theme: 'light', editorWidth: 720 },
    })
    expect(result.editor.fontSize).toBe(48)
  })

  it('clamps editorWidth to range', () => {
    const result = mergeWithDefaults({
      editor: { fontSize: 16, theme: 'light', editorWidth: 200 },
    })
    expect(result.editor.editorWidth).toBe(400)
  })

  it('resets invalid theme to default', () => {
    const result = mergeWithDefaults({
      // @ts-expect-error - testing invalid value
      editor: { fontSize: 16, theme: 'purple', editorWidth: 720 },
    })
    expect(result.editor.theme).toBe('light')
  })

  it('handles NaN fontSize', () => {
    const result = mergeWithDefaults({
      editor: { fontSize: NaN, theme: 'light', editorWidth: 720 },
    })
    expect(result.editor.fontSize).toBe(8) // clamp default
  })

  it('truncates recentWorkspaces to max 10', () => {
    const workspaces = Array.from({ length: 15 }, (_, i) => `/workspace-${i}`)
    const result = mergeWithDefaults({ recentWorkspaces: workspaces })
    expect(result.recentWorkspaces).toHaveLength(10)
  })

  it('preserves lastWorkspacePath', () => {
    const result = mergeWithDefaults({ lastWorkspacePath: '/my/workspace' })
    expect(result.lastWorkspacePath).toBe('/my/workspace')
  })

  it('merges plugin enabled flags', () => {
    const result = mergeWithDefaults({
      plugins: { enabled: { katex: true, mermaid: false } },
    })
    expect(result.plugins.enabled).toEqual({ katex: true, mermaid: false })
  })
})
