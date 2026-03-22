import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import TableControls from '../TableControls.svelte'

describe('TableControls', () => {
  it('エディターがnullの場合非表示', () => {
    render(TableControls, { props: { editor: null } })
    expect(screen.queryByTestId('table-controls')).toBeNull()
  })

  it('テーブル外の場合非表示', () => {
    const mockEditor = {
      isActive: (type: string) => false,
    } as any
    render(TableControls, { props: { editor: mockEditor } })
    expect(screen.queryByTestId('table-controls')).toBeNull()
  })
})
