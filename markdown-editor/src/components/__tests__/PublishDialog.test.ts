import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import PublishDialog from '../dialogs/PublishDialog.svelte'

// jsdom does not implement HTMLDialogElement methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

// Mock stores
vi.mock('$lib/stores/publish-store.svelte', () => ({
  getPublishProgress: () => ({ status: 'idle', currentStep: 'validate', completedSteps: 0, totalSteps: 7 }),
  startPublish: vi.fn().mockResolvedValue({ success: true }),
  cancelPublish: vi.fn(),
  isPublishing: () => false,
}))

vi.mock('$lib/stores/platform-store.svelte', () => ({
  getConnections: () => [{ platformId: 'zenn', displayName: 'Zenn' }],
  hasCredentials: () => true,
}))

vi.mock('$lib/utils/network-status.svelte', () => ({
  getIsOnline: () => true,
}))

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: vi.fn(),
}))

vi.mock('$lib/utils/error-messages', () => ({
  formatErrorMessage: (e: Error) => e.message,
}))

describe('PublishDialog', () => {
  it('renders dialog with title input', () => {
    render(PublishDialog, { props: { open: false, filePath: '/test.md', images: [] } })
    // Dialog is hidden when open=false, but element should exist
    const dialog = document.querySelector('[data-testid="publish-dialog"]')
    expect(dialog).toBeTruthy()
  })
})
