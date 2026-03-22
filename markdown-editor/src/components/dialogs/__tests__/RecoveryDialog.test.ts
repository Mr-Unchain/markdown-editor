import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import RecoveryDialog from '../RecoveryDialog.svelte'

describe('RecoveryDialog', () => {
  const defaultProps = {
    isOpen: false,
    recoveryFiles: [
      {
        originalPath: '/workspace/file.md',
        recoveryPath: '/workspace/.recovery/file.recovery',
        content: '# Recovered',
        timestamp: Date.now(),
      },
    ],
    onRecover: vi.fn(),
    onDiscard: vi.fn(),
    onClose: vi.fn(),
  }

  it('data-testid="recovery-dialog"が設定されている', () => {
    render(RecoveryDialog, { props: defaultProps })
    expect(screen.getByTestId('recovery-dialog')).toBeTruthy()
  })

  it('dialog要素が使用されている', () => {
    render(RecoveryDialog, { props: defaultProps })
    const dialog = screen.getByTestId('recovery-dialog')
    expect(dialog.tagName).toBe('DIALOG')
  })

  it('リカバリファイルリストが表示される', () => {
    render(RecoveryDialog, { props: defaultProps })
    expect(screen.getByTestId('recovery-list')).toBeTruthy()
  })
})
