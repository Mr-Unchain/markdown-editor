import { describe, it, expect } from 'vitest'
import { FileSystemError, ok, err } from '../filesystem'

describe('Result type utilities', () => {
  it('ok() creates a success result', () => {
    const result = ok('hello')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('hello')
    }
  })

  it('err() creates a failure result', () => {
    const error = new FileSystemError('NOT_FOUND', 'File not found', '/test.md')
    const result = err(error)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
      expect(result.error.message).toBe('File not found')
      expect(result.error.path).toBe('/test.md')
    }
  })
})

describe('FileSystemError', () => {
  it('creates error with code, message, and path', () => {
    const error = new FileSystemError('PERMISSION_DENIED', 'Access denied', '/secret.md')
    expect(error.code).toBe('PERMISSION_DENIED')
    expect(error.message).toBe('Access denied')
    expect(error.path).toBe('/secret.md')
    expect(error.name).toBe('FileSystemError')
    expect(error).toBeInstanceOf(Error)
  })

  it('creates error without path', () => {
    const error = new FileSystemError('IO_ERROR', 'Disk failure')
    expect(error.code).toBe('IO_ERROR')
    expect(error.path).toBeUndefined()
  })
})
