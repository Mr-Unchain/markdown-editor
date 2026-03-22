import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import LinkPopover from '../LinkPopover.svelte'

describe('LinkPopover', () => {
  const defaultState = {
    isOpen: true,
    url: '',
    text: '',
    openInNewTab: false,
    mode: 'create' as const,
  }

  it('isOpen=trueでポップオーバーを表示する', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: defaultState,
        onClose: vi.fn(),
      },
    })
    expect(screen.getByTestId('link-popover')).toBeTruthy()
  })

  it('isOpen=falseでポップオーバーを非表示にする', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: { ...defaultState, isOpen: false },
        onClose: vi.fn(),
      },
    })
    expect(screen.queryByTestId('link-popover')).toBeNull()
  })

  it('role="dialog"を持つ', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: defaultState,
        onClose: vi.fn(),
      },
    })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('URL入力フィールドが表示される', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: defaultState,
        onClose: vi.fn(),
      },
    })
    expect(screen.getByTestId('link-url-input')).toBeTruthy()
  })

  it('編集モードで削除ボタンが表示される', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: { ...defaultState, mode: 'edit' as const },
        onClose: vi.fn(),
      },
    })
    expect(screen.getByTestId('link-remove')).toBeTruthy()
  })

  it('作成モードで削除ボタンが非表示', () => {
    render(LinkPopover, {
      props: {
        editor: null,
        linkState: defaultState,
        onClose: vi.fn(),
      },
    })
    expect(screen.queryByTestId('link-remove')).toBeNull()
  })
})
