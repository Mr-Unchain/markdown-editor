import { describe, it, expect, beforeEach } from 'vitest'
import { MockGitHubApiClient } from '../github-api-client'
import {
  GitHubFileResponseSchema,
  GitHubCommitResponseSchema,
  GitHubRateLimitResponseSchema,
} from '../github-api-schemas'

describe('MockGitHubApiClient', () => {
  let client: MockGitHubApiClient

  beforeEach(() => {
    client = new MockGitHubApiClient()
  })

  describe('getFile', () => {
    it('returns seeded file with base64 content', async () => {
      client.seedFile('articles/test.md', '# Hello', 'sha123')
      const result = await client.getFile('articles/test.md')

      expect(result.path).toBe('articles/test.md')
      expect(result.sha).toBe('sha123')
      expect(atob(result.content)).toBe('# Hello')
    })

    it('throws 404 for non-existent file', async () => {
      await expect(client.getFile('not-found.md')).rejects.toThrow()
    })

    it('response matches GitHubFileResponseSchema', async () => {
      client.seedFile('test.md', 'content', 'sha1')
      const result = await client.getFile('test.md')
      expect(() => GitHubFileResponseSchema.parse(result)).not.toThrow()
    })
  })

  describe('createOrUpdateFile', () => {
    it('creates new file', async () => {
      const result = await client.createOrUpdateFile('new.md', '# New', 'create')

      expect(result.content.path).toBe('new.md')
      expect(result.content.sha).toBeTruthy()
      expect(result.commit.message).toBe('create')
    })

    it('updates existing file with matching sha', async () => {
      client.seedFile('existing.md', 'old', 'sha-old')
      const result = await client.createOrUpdateFile('existing.md', 'new', 'update', 'sha-old')

      expect(result.content.path).toBe('existing.md')
      expect(client.getStoredFile('existing.md')?.content).toBe('new')
    })

    it('throws 409 on sha mismatch', async () => {
      client.seedFile('conflict.md', 'content', 'sha-current')
      await expect(
        client.createOrUpdateFile('conflict.md', 'new', 'update', 'sha-wrong'),
      ).rejects.toThrow()
    })

    it('response matches GitHubCommitResponseSchema', async () => {
      const result = await client.createOrUpdateFile('test.md', 'content', 'msg')
      expect(() => GitHubCommitResponseSchema.parse(result)).not.toThrow()
    })
  })

  describe('getRateLimit', () => {
    it('returns rate limit info', async () => {
      const result = await client.getRateLimit()
      expect(result.resources.core.remaining).toBeGreaterThan(0)
    })

    it('response matches GitHubRateLimitResponseSchema', async () => {
      const result = await client.getRateLimit()
      expect(() => GitHubRateLimitResponseSchema.parse(result)).not.toThrow()
    })
  })

  describe('testAuth', () => {
    it('returns true', async () => {
      expect(await client.testAuth()).toBe(true)
    })
  })

  describe('call logging', () => {
    it('logs all calls', async () => {
      client.seedFile('a.md', 'x', 's')
      await client.getFile('a.md')
      await client.testAuth()

      expect(client.callLog).toHaveLength(2)
      expect(client.callLog[0].method).toBe('getFile')
      expect(client.callLog[1].method).toBe('testAuth')
    })

    it('reset clears state', () => {
      client.seedFile('a.md', 'x', 's')
      client.reset()
      expect(client.getStoredFile('a.md')).toBeUndefined()
      expect(client.callLog).toHaveLength(0)
    })
  })
})
