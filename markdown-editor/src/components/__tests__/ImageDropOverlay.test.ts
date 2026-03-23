import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ImageDropOverlay from '../editor/ImageDropOverlay.svelte'

vi.mock('$lib/stores/image-store.svelte', () => ({
  handleImageDrop: vi.fn().mockResolvedValue([{ success: true, markdownRef: './img.png' }]),
  getIsProcessing: () => false,
}))

describe('ImageDropOverlay', () => {
  it('renders drop zone', () => {
    render(ImageDropOverlay, {
      props: { filePath: '/test.md', onInsert: vi.fn() },
    })
    expect(screen.getByTestId('image-drop-overlay')).toBeTruthy()
  })
})
