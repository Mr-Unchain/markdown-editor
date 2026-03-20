import { initializeApp } from '$lib/app-init'

export const prerender = true
export const ssr = false

export async function load() {
  const context = await initializeApp()
  return {
    settingsManager: context.settingsManager,
  }
}
