export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error'
export type AutoSaveMode = 'auto' | 'manual'

export const saveState = $state<{ status: SaveStatus; autoSaveMode: AutoSaveMode }>({
  status: 'saved',
  autoSaveMode: 'manual',
})

export function setSaveStatus(status: SaveStatus): void {
  saveState.status = status
}

export function setAutoSaveMode(mode: AutoSaveMode): void {
  saveState.autoSaveMode = mode
}
