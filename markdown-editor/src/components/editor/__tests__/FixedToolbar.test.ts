import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import FixedToolbar from '../FixedToolbar.svelte'
import { DEFAULT_ACTIVE_FORMATS } from '$lib/types/editor'

describe('FixedToolbar', () => {
  const defaultProps = {
    editor: null,
    activeFormats: { ...DEFAULT_ACTIVE_FORMATS },
    canUndo: false,
    canRedo: false,
  }

  it('ツールバーをレンダリングする', () => {
    render(FixedToolbar, { props: defaultProps })
    expect(screen.getByTestId('fixed-toolbar')).toBeTruthy()
  })

  it('role="toolbar"を持つ', () => {
    render(FixedToolbar, { props: defaultProps })
    expect(screen.getByRole('toolbar', { name: '書式ツールバー' })).toBeTruthy()
  })

  it('書式ボタンが表示される', () => {
    render(FixedToolbar, { props: defaultProps })
    expect(screen.getByTestId('format-bold')).toBeTruthy()
    expect(screen.getByTestId('format-italic')).toBeTruthy()
    expect(screen.getByTestId('format-strike')).toBeTruthy()
    expect(screen.getByTestId('format-code')).toBeTruthy()
  })

  it('エディターがnullの場合ボタンが無効', () => {
    render(FixedToolbar, { props: defaultProps })
    const btn = screen.getByTestId('format-bold') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('見出しドロップダウンが表示される', () => {
    render(FixedToolbar, { props: defaultProps })
    expect(screen.getByTestId('heading-dropdown')).toBeTruthy()
  })
})
