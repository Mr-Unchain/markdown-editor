import type { Workspace, RecentWorkspace } from '$lib/types/workspace'

export interface WorkspaceState {
  current: Workspace | null
  isLoading: boolean
  recentWorkspaces: RecentWorkspace[]
}

export const workspaceState = $state<WorkspaceState>({
  current: null,
  isLoading: false,
  recentWorkspaces: [],
})

export function setWorkspace(workspace: Workspace | null): void {
  workspaceState.current = workspace
}

export function setWorkspaceLoading(isLoading: boolean): void {
  workspaceState.isLoading = isLoading
}

export function addRecentWorkspace(workspace: RecentWorkspace, maxCount = 10): void {
  const filtered = workspaceState.recentWorkspaces.filter(
    (w) => w.path !== workspace.path,
  )
  workspaceState.recentWorkspaces = [workspace, ...filtered].slice(0, maxCount)
}

export function setRecentWorkspaces(workspaces: RecentWorkspace[]): void {
  workspaceState.recentWorkspaces = workspaces
}

export function resetWorkspaceState(): void {
  workspaceState.current = null
  workspaceState.isLoading = false
}
