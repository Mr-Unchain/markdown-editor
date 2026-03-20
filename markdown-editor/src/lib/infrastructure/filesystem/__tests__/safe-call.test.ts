import { describe, it, expect, vi } from 'vitest'
import { safeCall, toFileSystemError } from '../safe-call'
import { FileSystemError } from '$lib/types/filesystem'

describe('toFileSystemError', () => {
  it('returns FileSystemError as-is', () => {
    const original = new FileSystemError('NOT_FOUND', 'Not found', '/test')
    const result = toFileSystemError(original)
    expect(result).toBe(original)
  })

  it('maps "not found" message to NOT_FOUND code', () => {
    const result = toFileSystemError(new Error('File not found'))
    expect(result.code).toBe('NOT_FOUND')
  })

  it('maps "no such file" message to NOT_FOUND code', () => {
    const result = toFileSystemError(new Error('no such file or directory'))
    expect(result.code).toBe('NOT_FOUND')
  })

  it('maps "permission" message to PERMISSION_DENIED code', () => {
    const result = toFileSystemError(new Error('Permission denied'))
    expect(result.code).toBe('PERMISSION_DENIED')
  })

  it('maps "already exists" message to ALREADY_EXISTS code', () => {
    const result = toFileSystemError(new Error('File already exists'))
    expect(result.code).toBe('ALREADY_EXISTS')
  })

  it('maps unknown error to UNKNOWN code', () => {
    const result = toFileSystemError(new Error('Something went wrong'))
    expect(result.code).toBe('UNKNOWN')
  })

  it('handles non-Error values', () => {
    const result = toFileSystemError('string error')
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBe('string error')
  })

  it('includes path when provided', () => {
    const result = toFileSystemError(new Error('fail'), '/my/file.md')
    expect(result.path).toBe('/my/file.md')
  })
})

describe('safeCall', () => {
  it('returns ok result on success', async () => {
    const result = await safeCall(async () => 'data')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('data')
    }
  })

  it('returns err result on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await safeCall(async () => {
      throw new Error('File not found')
    }, '/test.md')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
      expect(result.error.path).toBe('/test.md')
    }
  })

  it('logs error to console on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await safeCall(async () => {
      throw new Error('IO error')
    })
    expect(consoleSpy).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })
})
