import { describe, it, expect, beforeEach } from 'vitest'
import { layoutState, toggleSidebar, setSidebarPanel, closeSidebar, resetLayout } from '../layout.svelte'

describe('layoutState store', () => {
  beforeEach(() => {
    resetLayout()
  })

  it('starts with sidebar hidden', () => {
    expect(layoutState.sidebarVisible).toBe(false)
  })

  it('starts with files panel', () => {
    expect(layoutState.sidebarPanel).toBe('files')
  })

  it('starts with 260px width', () => {
    expect(layoutState.sidebarWidth).toBe(260)
  })

  it('toggleSidebar toggles visibility', () => {
    toggleSidebar()
    expect(layoutState.sidebarVisible).toBe(true)
    toggleSidebar()
    expect(layoutState.sidebarVisible).toBe(false)
  })

  it('setSidebarPanel changes panel and opens sidebar', () => {
    setSidebarPanel('settings')
    expect(layoutState.sidebarPanel).toBe('settings')
    expect(layoutState.sidebarVisible).toBe(true)
  })

  it('closeSidebar hides sidebar', () => {
    toggleSidebar() // open
    closeSidebar()
    expect(layoutState.sidebarVisible).toBe(false)
  })
})
