import type { FileContent } from '$lib/types/filesystem'

export const fileState = $state<{ current: FileContent | null }>({ current: null })

export function setCurrentFile(file: FileContent | null): void {
  fileState.current = file
}
