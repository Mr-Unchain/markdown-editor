import type { Tab, TabCursorState } from '$lib/types/workspace'

export interface TabsState {
  tabs: Tab[]
}

export const tabsState = $state<TabsState>({
  tabs: [],
})

export function getActiveTab(): Tab | null {
  return tabsState.tabs.find((t) => t.isActive) ?? null
}

export function getDirtyTabs(): Tab[] {
  return tabsState.tabs.filter((t) => t.isDirty)
}

export function addTab(tab: Tab): void {
  tabsState.tabs = [...tabsState.tabs, tab]
}

export function removeTab(filePath: string): void {
  tabsState.tabs = tabsState.tabs.filter((t) => t.filePath !== filePath)
}

export function setActiveTab(filePath: string): void {
  tabsState.tabs = tabsState.tabs.map((t) => ({
    ...t,
    isActive: t.filePath === filePath,
  }))
}

export function updateTabContent(filePath: string, content: string): void {
  const tab = tabsState.tabs.find((t) => t.filePath === filePath)
  if (tab) {
    tab.content = content
    tab.isDirty = true
  }
}

export function markTabSaved(filePath: string): void {
  const tab = tabsState.tabs.find((t) => t.filePath === filePath)
  if (tab) {
    tab.isDirty = false
  }
}

export function updateTabCursorState(filePath: string, cursorState: Partial<TabCursorState>): void {
  const tab = tabsState.tabs.find((t) => t.filePath === filePath)
  if (tab) {
    tab.cursorState = { ...tab.cursorState, ...cursorState }
  }
}

export function reorderTabs(fromIndex: number, toIndex: number): void {
  const tabs = [...tabsState.tabs]
  const [moved] = tabs.splice(fromIndex, 1)
  if (moved) {
    tabs.splice(toIndex, 0, moved)
    tabsState.tabs = tabs
  }
}

export function setTabs(tabs: Tab[]): void {
  tabsState.tabs = tabs
}

export function resetTabsState(): void {
  tabsState.tabs = []
}
