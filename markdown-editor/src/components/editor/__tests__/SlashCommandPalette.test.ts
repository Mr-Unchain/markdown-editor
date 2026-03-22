import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import SlashCommandPalette from '../SlashCommandPalette.svelte'
import { SLASH_COMMAND_ITEMS } from '$lib/core/editor/slash-commands'

describe('SlashCommandPalette', () => {
  it('全コマンドアイテムを表示する', () => {
    render(SlashCommandPalette, {
      props: {
        items: SLASH_COMMAND_ITEMS,
        selectedIndex: 0,
        onSelect: vi.fn(),
      },
    })
    expect(screen.getByTestId('slash-command-list')).toBeTruthy()
    expect(screen.getByTestId('slash-command-paragraph')).toBeTruthy()
    expect(screen.getByTestId('slash-command-heading1')).toBeTruthy()
  })

  it('空アイテムで「コマンドが見つかりません」を表示する', () => {
    render(SlashCommandPalette, {
      props: {
        items: [],
        selectedIndex: 0,
        onSelect: vi.fn(),
      },
    })
    expect(screen.getByText('コマンドが見つかりません')).toBeTruthy()
  })

  it('role="listbox"を持つ', () => {
    render(SlashCommandPalette, {
      props: {
        items: SLASH_COMMAND_ITEMS,
        selectedIndex: 0,
        onSelect: vi.fn(),
      },
    })
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('選択中アイテムにaria-selected=trueが設定される', () => {
    render(SlashCommandPalette, {
      props: {
        items: SLASH_COMMAND_ITEMS,
        selectedIndex: 0,
        onSelect: vi.fn(),
      },
    })
    const firstItem = screen.getByTestId('slash-command-paragraph')
    expect(firstItem.getAttribute('aria-selected')).toBe('true')
  })
})
