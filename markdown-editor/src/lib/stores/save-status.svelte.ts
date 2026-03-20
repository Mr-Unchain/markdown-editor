export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error'

export const saveState = $state<{ status: SaveStatus }>({ status: 'saved' })

export function setSaveStatus(status: SaveStatus): void {
  saveState.status = status
}
