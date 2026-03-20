import type { LayoutState, SidebarPanel } from '$lib/types/layout'

const DEFAULT_LAYOUT: LayoutState = {
  sidebarVisible: false,
  sidebarPanel: 'files',
  sidebarWidth: 260,
}

export const layoutState: LayoutState = $state({ ...DEFAULT_LAYOUT })

export function toggleSidebar(): void {
  layoutState.sidebarVisible = !layoutState.sidebarVisible
}

export function setSidebarPanel(panel: SidebarPanel): void {
  layoutState.sidebarPanel = panel
  layoutState.sidebarVisible = true
}

export function closeSidebar(): void {
  layoutState.sidebarVisible = false
}

export function resetLayout(): void {
  Object.assign(layoutState, DEFAULT_LAYOUT)
}
