import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ExportMenu from '../toolbar/ExportMenu.svelte'

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: vi.fn(),
}))

describe('ExportMenu', () => {
  it('renders export button', () => {
    render(ExportMenu, {
      props: { exportService: null, markdownContent: '# Hello', editorHTML: '<h1>Hello</h1>' },
    })
    expect(screen.getByTestId('export-menu-trigger')).toBeTruthy()
  })

  it('toggles dropdown on click', async () => {
    render(ExportMenu, {
      props: { exportService: null, markdownContent: '', editorHTML: '' },
    })
    const trigger = screen.getByTestId('export-menu-trigger')
    await fireEvent.click(trigger)

    expect(screen.getByTestId('export-md-copy')).toBeTruthy()
    expect(screen.getByTestId('export-html-copy')).toBeTruthy()
  })
})
