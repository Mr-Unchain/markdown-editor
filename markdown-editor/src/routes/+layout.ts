import { initializeApp } from '$lib/app-init'

export const prerender = true
export const ssr = false

export async function load() {
  try {
    const context = await initializeApp()
    return {
      settingsManager: context.settingsManager,
      error: null,
    }
  } catch (err) {
    console.error('App initialization failed:', err)
    return {
      settingsManager: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
