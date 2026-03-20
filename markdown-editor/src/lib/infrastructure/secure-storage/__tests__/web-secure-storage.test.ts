import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebSecureStorage } from '../web-secure-storage'

describe('WebSecureStorage', () => {
  let storage: WebSecureStorage

  beforeEach(() => {
    storage = new WebSecureStorage()
    localStorage.clear()
  })

  it('set stores base64-encoded value', async () => {
    await storage.set('test-key', 'secret-value')
    const stored = localStorage.getItem('markdown-editor-secure:test-key')
    expect(stored).toBe(btoa('secret-value'))
  })

  it('get decodes stored value', async () => {
    localStorage.setItem('markdown-editor-secure:test-key', btoa('secret-value'))
    const result = await storage.get('test-key')
    expect(result).toBe('secret-value')
  })

  it('get returns null when key not found', async () => {
    const result = await storage.get('missing-key')
    expect(result).toBeNull()
  })

  it('get returns null for invalid base64', async () => {
    localStorage.setItem('markdown-editor-secure:bad', '!!!invalid-base64!!!')
    const result = await storage.get('bad')
    expect(result).toBeNull()
  })

  it('remove deletes the key', async () => {
    localStorage.setItem('markdown-editor-secure:key', btoa('value'))
    await storage.remove('key')
    expect(localStorage.getItem('markdown-editor-secure:key')).toBeNull()
  })

  it('has returns true when key exists', async () => {
    localStorage.setItem('markdown-editor-secure:key', btoa('value'))
    const result = await storage.has('key')
    expect(result).toBe(true)
  })

  it('has returns false when key does not exist', async () => {
    const result = await storage.has('missing')
    expect(result).toBe(false)
  })

  it('shows security warning on first set', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await storage.set('key', 'value')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('localStorage'))
    warnSpy.mockRestore()
  })
})
