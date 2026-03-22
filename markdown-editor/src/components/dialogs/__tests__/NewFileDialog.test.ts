import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import NewFileDialog from '../NewFileDialog.svelte'

describe('NewFileDialog', () => {
  // Note: HTMLDialogElement.showModal() is not available in jsdom,
  // so we test the component's structure when closed
  const defaultProps = {
    isOpen: false,
    parentPath: '/workspace',
    mode: 'file' as const,
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  }

  it('data-testid="new-file-dialog"が設定されている', () => {
    render(NewFileDialog, { props: defaultProps })
    expect(screen.getByTestId('new-file-dialog')).toBeTruthy()
  })

  it('dialog要素が使用されている', () => {
    render(NewFileDialog, { props: defaultProps })
    const dialog = screen.getByTestId('new-file-dialog')
    expect(dialog.tagName).toBe('DIALOG')
  })

  it('ファイルモードで正しいaria-labelが設定される', () => {
    render(NewFileDialog, { props: defaultProps })
    const dialog = screen.getByTestId('new-file-dialog')
    expect(dialog.getAttribute('aria-label')).toBe('新規ファイル作成')
  })

  it('フォルダモードで正しいaria-labelが設定される', () => {
    render(NewFileDialog, { props: { ...defaultProps, mode: 'folder' as const } })
    const dialog = screen.getByTestId('new-file-dialog')
    expect(dialog.getAttribute('aria-label')).toBe('新規フォルダ作成')
  })

  it('入力フィールドが存在する', () => {
    render(NewFileDialog, { props: defaultProps })
    expect(screen.getByTestId('new-file-name-input')).toBeTruthy()
  })
})
