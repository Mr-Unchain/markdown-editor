import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ContextMenu from '../ContextMenu.svelte'

describe('ContextMenu', () => {
  const defaultProps = {
    isOpen: true,
    position: { x: 100, y: 200 },
    items: [
      { action: 'newFile' as const, label: '新規ファイル' },
      { action: 'rename' as const, label: '名前を変更' },
      { action: 'delete' as const, label: '削除' },
    ],
    onAction: vi.fn(),
    onClose: vi.fn(),
  }

  it('isOpen=trueでメニューを表示する', () => {
    render(ContextMenu, { props: defaultProps })
    expect(screen.getByTestId('context-menu')).toBeTruthy()
  })

  it('isOpen=falseでメニューを非表示にする', () => {
    render(ContextMenu, { props: { ...defaultProps, isOpen: false } })
    expect(screen.queryByTestId('context-menu')).toBeNull()
  })

  it('role="menu"属性が設定されている', () => {
    render(ContextMenu, { props: defaultProps })
    expect(screen.getByRole('menu')).toBeTruthy()
  })

  it('メニュー項目がrole="menuitem"で表示される', () => {
    render(ContextMenu, { props: defaultProps })
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(3)
  })
})
