import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import { confirmState, showConfirm } from '$lib/stores/confirm.svelte'
import ConfirmDialog from '../ConfirmDialog.svelte'

const defaultState = {
  visible: false,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: 'キャンセル',
  onConfirm: null,
  onCancel: null,
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    Object.assign(confirmState, defaultState)
  })

  it('is hidden when not visible', () => {
    render(ConfirmDialog)
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })

  it('shows dialog when visible', () => {
    showConfirm({
      title: 'テスト',
      message: '本当に削除しますか？',
      onConfirm: vi.fn(),
    })
    render(ConfirmDialog)
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    expect(screen.getByText('テスト')).toBeInTheDocument()
    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
  })

  it('calls onConfirm and closes on confirm click', async () => {
    const onConfirm = vi.fn()
    showConfirm({
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm,
    })
    render(ConfirmDialog)

    await fireEvent.click(screen.getByTestId('confirm-dialog-confirm'))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })

  it('calls onCancel and closes on cancel click', async () => {
    const onCancel = vi.fn()
    showConfirm({
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm: vi.fn(),
      onCancel,
    })
    render(ConfirmDialog)

    await fireEvent.click(screen.getByTestId('confirm-dialog-cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })

  it('shows custom button labels', () => {
    showConfirm({
      title: 'Delete',
      message: 'Delete this file?',
      confirmLabel: '削除',
      cancelLabel: '戻る',
      onConfirm: vi.fn(),
    })
    render(ConfirmDialog)
    expect(screen.getByText('削除')).toBeInTheDocument()
    expect(screen.getByText('戻る')).toBeInTheDocument()
  })
})
