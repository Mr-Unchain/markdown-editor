import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/svelte'
import PlatformSettingsDialog from '../dialogs/PlatformSettingsDialog.svelte'

// jsdom does not implement HTMLDialogElement methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

vi.mock('$lib/stores/platform-store.svelte', () => ({
  getConnections: () => [
    { platformId: 'zenn', displayName: 'Zenn', isConfigured: false, connectionStatus: 'unknown' },
  ],
  saveCredentials: vi.fn(),
  removeCredentials: vi.fn(),
  setConnectionTesting: vi.fn(),
  updateConnectionStatus: vi.fn(),
}))

describe('PlatformSettingsDialog', () => {
  it('renders dialog element', () => {
    render(PlatformSettingsDialog, { props: { open: false, publishService: null } })
    const dialog = document.querySelector('[data-testid="platform-settings-dialog"]')
    expect(dialog).toBeTruthy()
  })
})
