import type { PluginInstance } from '$lib/types/plugin'
import { notify } from '$lib/stores/notifications.svelte'

/**
 * プラグインを遅延ロードする（R-U2-03: 指数バックオフリトライ）
 */
export async function loadPluginWithRetry(
  loader: () => Promise<PluginInstance>,
  pluginName: string,
  maxRetries = 3,
): Promise<PluginInstance | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await loader()
    } catch (e) {
      console.error(`[PluginLoader] ${pluginName} attempt ${attempt + 1} failed:`, e)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  notify('warning', `${pluginName}プラグインの読み込みに失敗しました`)
  return null
}
