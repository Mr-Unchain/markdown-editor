import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import TabBar from '../TabBar.svelte'
import type { Tab } from '$lib/types/workspace'
import { DEFAULT_CURSOR_STATE } from '$lib/types/workspace'

function createTab(filePath: string, isActive = false, isDirty = false): Tab {
  return {
    filePath,
    displayName: filePath.split('/').pop() ?? '',
    content: '# Hello',
    isDirty,
    isActive,
    fileType: 'markdown',
    cursorState: { ...DEFAULT_CURSOR_STATE },
    isExternal: false,
  }
}

describe('TabBar', () => {
  it('タブがなければレンダリングしない', () => {
    render(TabBar, { props: { tabs: [] } })
    expect(screen.queryByTestId('tab-bar')).toBeNull()
  })

  it('タブをレンダリングする', () => {
    const tabs = [
      createTab('/workspace/file1.md', true),
      createTab('/workspace/file2.md'),
    ]
    render(TabBar, { props: { tabs } })
    expect(screen.getByTestId('tab-bar')).toBeTruthy()
    expect(screen.getAllByTestId('tab-item')).toHaveLength(2)
  })

  it('role="tablist"属性が設定されている', () => {
    const tabs = [createTab('/workspace/file.md', true)]
    render(TabBar, { props: { tabs } })
    expect(screen.getByRole('tablist')).toBeTruthy()
  })

  it('aria-label属性が設定されている', () => {
    const tabs = [createTab('/workspace/file.md', true)]
    render(TabBar, { props: { tabs } })
    const tablist = screen.getByRole('tablist')
    expect(tablist.getAttribute('aria-label')).toBe('開いているファイル')
  })

  it('アクティブタブにaria-selected=trueが設定される', () => {
    const tabs = [
      createTab('/workspace/file1.md', true),
      createTab('/workspace/file2.md'),
    ]
    render(TabBar, { props: { tabs } })
    const tabItems = screen.getAllByRole('tab')
    expect(tabItems[0]!.getAttribute('aria-selected')).toBe('true')
    expect(tabItems[1]!.getAttribute('aria-selected')).toBe('false')
  })

  it('未保存インジケーターが表示される', () => {
    const tabs = [createTab('/workspace/file.md', true, true)]
    render(TabBar, { props: { tabs } })
    expect(screen.getByLabelText('未保存')).toBeTruthy()
  })
})
