import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { layoutState, resetLayout } from '$lib/stores/layout.svelte'
import Sidebar from '../Sidebar.svelte'

describe('Sidebar', () => {
  beforeEach(() => {
    resetLayout()
  })

  it('is hidden when sidebarVisible is false', () => {
    render(Sidebar)
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('is visible when sidebarVisible is true', () => {
    layoutState.sidebarVisible = true
    render(Sidebar)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('shows files panel by default', () => {
    layoutState.sidebarVisible = true
    layoutState.sidebarPanel = 'files'
    render(Sidebar)
    expect(screen.getByTestId('sidebar-files-panel')).toBeInTheDocument()
  })

  it('shows settings panel when selected', () => {
    layoutState.sidebarVisible = true
    layoutState.sidebarPanel = 'settings'
    render(Sidebar)
    expect(screen.getByTestId('sidebar-settings-panel')).toBeInTheDocument()
  })

  it('applies correct width', () => {
    layoutState.sidebarVisible = true
    layoutState.sidebarWidth = 300
    render(Sidebar)
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar.style.width).toBe('300px')
  })
})
