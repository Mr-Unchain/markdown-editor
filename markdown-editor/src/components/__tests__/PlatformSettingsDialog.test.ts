import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import PlatformSettingsDialog from '../dialogs/PlatformSettingsDialog.svelte'

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
