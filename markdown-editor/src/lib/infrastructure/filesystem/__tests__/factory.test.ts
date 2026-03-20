import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isTauri, isFileSystemAccessSupported, createFileSystemAdapter } from '../factory'

describe('isTauri', () => {
  afterEach(() => {
    // @ts-expect-error - cleaning up test property
    delete window.__TAURI_INTERNALS__
  })

  it('returns true when __TAURI_INTERNALS__ exists', () => {
    // @ts-expect-error - setting up test property
    window.__TAURI_INTERNALS__ = {}
    expect(isTauri()).toBe(true)
  })

  it('returns false when __TAURI_INTERNALS__ does not exist', () => {
    expect(isTauri()).toBe(false)
  })
})

describe('isFileSystemAccessSupported', () => {
  it('returns true when showOpenFilePicker exists', () => {
    // @ts-expect-error - setting up test property
    window.showOpenFilePicker = vi.fn()
    expect(isFileSystemAccessSupported()).toBe(true)
    // @ts-expect-error - cleaning up test property
    delete window.showOpenFilePicker
  })

  it('returns false when showOpenFilePicker does not exist', () => {
    expect(isFileSystemAccessSupported()).toBe(false)
  })
})

describe('createFileSystemAdapter', () => {
  afterEach(() => {
    // @ts-expect-error - cleaning up
    delete window.__TAURI_INTERNALS__
    // @ts-expect-error - cleaning up
    delete window.showOpenFilePicker
  })

  it('throws when no supported environment', () => {
    expect(() => createFileSystemAdapter()).toThrow('お使いの環境はサポートされていません')
  })
})
