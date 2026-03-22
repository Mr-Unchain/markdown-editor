import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import CodeBlockWrapper from '../CodeBlockWrapper.svelte'

describe('CodeBlockWrapper', () => {
  it('ラッパーをレンダリングする', () => {
    render(CodeBlockWrapper, {
      props: {
        language: 'javascript',
        onLanguageChange: vi.fn(),
        onCopy: vi.fn(),
      },
    })
    expect(screen.getByTestId('code-block-wrapper')).toBeTruthy()
  })

  it('言語セレクトが表示される', () => {
    render(CodeBlockWrapper, {
      props: {
        language: 'typescript',
        onLanguageChange: vi.fn(),
        onCopy: vi.fn(),
      },
    })
    const select = screen.getByTestId('code-block-language-select') as HTMLSelectElement
    expect(select).toBeTruthy()
  })

  it('コピーボタンが表示される', () => {
    render(CodeBlockWrapper, {
      props: {
        language: 'javascript',
        onLanguageChange: vi.fn(),
        onCopy: vi.fn(),
      },
    })
    expect(screen.getByTestId('code-block-copy')).toBeTruthy()
  })

  it('role="combobox"を持つ', () => {
    render(CodeBlockWrapper, {
      props: {
        language: 'javascript',
        onLanguageChange: vi.fn(),
        onCopy: vi.fn(),
      },
    })
    expect(screen.getByRole('combobox')).toBeTruthy()
  })
})
