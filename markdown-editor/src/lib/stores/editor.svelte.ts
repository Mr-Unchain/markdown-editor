import type { EditorState } from '$lib/types/editor'
import { DEFAULT_EDITOR_STATE } from '$lib/types/editor'

/** エディター状態ストア（Svelte 5 $state ベース） */
export const editorState = $state<EditorState>({ ...DEFAULT_EDITOR_STATE })

/** エディター状態を更新する */
export function updateEditorState(state: Partial<EditorState>): void {
  Object.assign(editorState, state)
}

/** エディター状態をリセットする */
export function resetEditorState(): void {
  Object.assign(editorState, { ...DEFAULT_EDITOR_STATE })
}
