export type SidebarPanel = 'files' | 'settings'

export interface LayoutState {
  sidebarVisible: boolean
  sidebarPanel: SidebarPanel
  sidebarWidth: number
}
