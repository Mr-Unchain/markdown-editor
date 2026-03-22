import { describe, it, expect } from 'vitest'
import { validateLinkUrl } from '../link-validator'

describe('validateLinkUrl', () => {
  it('正常なhttps URLをそのまま通す', () => {
    const result = validateLinkUrl('https://example.com')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('https://example.com')
  })

  it('正常なhttp URLをそのまま通す', () => {
    const result = validateLinkUrl('http://example.com')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('http://example.com')
  })

  it('プロトコルなしURLにhttps://を付与する', () => {
    const result = validateLinkUrl('example.com')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('https://example.com')
  })

  it('javascript: プロトコルを拒否する', () => {
    const result = validateLinkUrl('javascript:alert(1)')
    expect(result.valid).toBe(false)
    expect(result.sanitized).toBe('')
  })

  it('JAVASCRIPT: (大文字)を拒否する', () => {
    const result = validateLinkUrl('JAVASCRIPT:alert(1)')
    expect(result.valid).toBe(false)
  })

  it('data: プロトコルを拒否する', () => {
    const result = validateLinkUrl('data:text/html,<script>alert(1)</script>')
    expect(result.valid).toBe(false)
  })

  it('vbscript: プロトコルを拒否する', () => {
    const result = validateLinkUrl('vbscript:MsgBox("XSS")')
    expect(result.valid).toBe(false)
  })

  it('空文字を拒否する', () => {
    const result = validateLinkUrl('')
    expect(result.valid).toBe(false)
  })

  it('スペースのみを拒否する', () => {
    const result = validateLinkUrl('   ')
    expect(result.valid).toBe(false)
  })

  it('相対パスを許可する', () => {
    const result = validateLinkUrl('/about')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('/about')
  })

  it('ハッシュリンクを許可する', () => {
    const result = validateLinkUrl('#section')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('#section')
  })

  it('mailto: を許可する', () => {
    const result = validateLinkUrl('mailto:user@example.com')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('mailto:user@example.com')
  })

  it('前後の空白をトリムする', () => {
    const result = validateLinkUrl('  https://example.com  ')
    expect(result.valid).toBe(true)
    expect(result.sanitized).toBe('https://example.com')
  })
})
