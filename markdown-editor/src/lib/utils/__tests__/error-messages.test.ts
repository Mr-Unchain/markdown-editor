import { describe, it, expect } from 'vitest'
import { classifyError, formatErrorMessage, getStructuredError } from '../error-messages'
import { GitHubApiError, PublishCancelledError } from '$lib/types/platform'

describe('error-messages', () => {
  describe('classifyError', () => {
    it('classifies GitHub 401 error', () => {
      const err = new GitHubApiError({ status: 401, statusText: 'Unauthorized' }, '/test')
      expect(classifyError(err)).toBe('github-401')
    })

    it('classifies GitHub 404 error', () => {
      const err = new GitHubApiError({ status: 404, statusText: 'Not Found' }, '/test')
      expect(classifyError(err)).toBe('github-404')
    })

    it('classifies GitHub 409 conflict', () => {
      const err = new GitHubApiError({ status: 409, statusText: 'Conflict' }, '/test')
      expect(classifyError(err)).toBe('github-409')
    })

    it('classifies rate limit error', () => {
      const err = new GitHubApiError({ status: 429, statusText: 'Too Many Requests' }, '/test')
      expect(classifyError(err)).toBe('github-rate-limit')
    })

    it('classifies rate limit by header', () => {
      const err = new GitHubApiError({ status: 403, statusText: 'Forbidden' }, '/test')
      ;(err as { rateLimitReset: number }).rateLimitReset = 1234567890
      expect(classifyError(err)).toBe('github-rate-limit')
    })

    it('classifies cancel error', () => {
      const err = new PublishCancelledError()
      expect(classifyError(err)).toBe('publish-cancelled')
    })

    it('classifies timeout error', () => {
      const err = new Error('AbortError')
      err.name = 'AbortError'
      expect(classifyError(err)).toBe('publish-timeout')
    })

    it('returns unknown for unrecognized errors', () => {
      expect(classifyError(new Error('something'))).toBe('unknown')
    })
  })

  describe('formatErrorMessage', () => {
    it('formats GitHub 401 with what/why/action', () => {
      const err = new GitHubApiError({ status: 401, statusText: 'Unauthorized' }, '/test')
      const msg = formatErrorMessage(err)
      expect(msg).toContain('Zennへの投稿に失敗しました')
      expect(msg).toContain('GitHub Token')
      expect(msg).toContain('設定画面')
    })

    it('formats unknown error with message', () => {
      const msg = formatErrorMessage(new Error('something broke'))
      expect(msg).toContain('something broke')
    })
  })

  describe('getStructuredError', () => {
    it('returns what/why/action object', () => {
      const err = new GitHubApiError({ status: 404, statusText: 'Not Found' }, '/test')
      const structured = getStructuredError(err)
      expect(structured.what).toBeTruthy()
      expect(structured.why).toBeTruthy()
      expect(structured.action).toBeTruthy()
    })

    it('returns generic for unknown errors', () => {
      const structured = getStructuredError(new Error('unknown'))
      expect(structured.what).toBe('エラーが発生しました')
    })
  })
})
