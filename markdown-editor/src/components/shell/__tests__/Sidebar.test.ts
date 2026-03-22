import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { layoutState, resetLayout } from '$lib/stores/layout.svelte'
import { workspaceState } from '$lib/stores/workspace.svelte'
import Sidebar from '../Sidebar.svelte'

describe('Sidebar', () => {
  beforeEach(() => {
    resetLayout()
    workspaceState.current = null
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

  it('shows empty state when no workspace is open', () => {
    layoutState.sidebarVisible = true
    render(Sidebar)
    expect(screen.getByTestId('sidebar-empty')).toBeInTheDocument()
  })

  it('shows open workspace button in empty state', () => {
    layoutState.sidebarVisible = true
    render(Sidebar)
    expect(screen.getByTestId('sidebar-open-workspace')).toBeInTheDocument()
  })

  it('applies correct width', () => {
    layoutState.sidebarVisible = true
    layoutState.sidebarWidth = 300
    render(Sidebar)
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar.style.width).toBe('300px')
  })
})
