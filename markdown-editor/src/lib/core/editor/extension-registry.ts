import type { Extension, Mark, Node as TiptapNode } from '@tiptap/core'

type AnyExtension = Extension | Mark | TiptapNode

export interface ExtensionRegistryResult {
  extensions: AnyExtension[]
  failed: string[]
}

/**
 * エクステンションを安全に登録する（R-U2-01: エラー隔離）
 *
 * コアエクステンション: 失敗時はエラーをそのまま投げる
 * オプショナルエクステンション: 失敗時は記録して続行
 */
export function safeRegisterExtensions(
  coreExtensions: AnyExtension[],
  optionalExtensions: AnyExtension[],
): ExtensionRegistryResult {
  const failed: string[] = []
  const extensions: AnyExtension[] = [...coreExtensions]

  for (const ext of optionalExtensions) {
    try {
      extensions.push(ext)
    } catch (e) {
      const name = (ext as { name?: string }).name ?? 'unknown'
      failed.push(name)
      console.error(`[EditorCore] Extension "${name}" failed to register:`, e)
    }
  }

  return { extensions, failed }
}
