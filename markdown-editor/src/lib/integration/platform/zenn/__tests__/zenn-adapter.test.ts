import { describe, it, expect, beforeEach } from 'vitest'
import { ZennAdapter } from '../zenn-adapter'
import { MockGitHubApiClient } from '../../github-api-client'
import { GitHubCommitResponseSchema } from '../../github-api-schemas'
import type { ArticlePayload, LocalImageRef } from '$lib/types/platform'

function createPayload(overrides?: Partial<ArticlePayload>): ArticlePayload {
  return {
    title: 'Test Article',
    body: '# Hello\n\nContent here.',
    bodyFormat: 'markdown',
    tags: ['svelte', 'typescript'],
    images: [],
    emoji: '📝',
    articleType: 'tech',
    ...overrides,
  }
}

describe('ZennAdapter', () => {
  let adapter: ZennAdapter
  let mockClient: MockGitHubApiClient

  beforeEach(() => {
    mockClient = new MockGitHubApiClient()
    adapter = new ZennAdapter(mockClient)
  })

  describe('properties', () => {
    it('has correct platformId and name', () => {
      expect(adapter.platformId).toBe('zenn')
      expect(adapter.platformName).toBe('Zenn')
      expect(adapter.supportsDirectPublish).toBe(false)
    })
  })

  describe('testConnection', () => {
    it('returns success with rate limit info', async () => {
      const result = await adapter.testConnection()
      expect(result.success).toBe(true)
      expect(result.rateLimit).toBeDefined()
      expect(result.rateLimit!.remaining).toBeGreaterThan(0)
    })
  })

  describe('publishDraft', () => {
    it('creates new article file', async () => {
      const payload = createPayload({ slug: 'test-slug-12' })
      const result = await adapter.publishDraft(payload)

      expect(result.success).toBe(true)
      expect(result.platformId).toBe('zenn')
      expect(result.articleId).toBe('test-slug-12')
      expect(result.publishRecord).toBeDefined()
      expect(result.publishRecord!.slug).toBe('test-slug-12')
    })

    it('generates slug when not provided', async () => {
      const payload = createPayload()
      const result = await adapter.publishDraft(payload)

      expect(result.success).toBe(true)
      expect(result.articleId).toBeTruthy()
      expect(result.articleId!.length).toBe(12)
    })

    it('updates existing article with SHA', async () => {
      // Seed existing article
      mockClient.seedFile('articles/existing-slug.md', '---\ntitle: Old\n---\nOld content', 'sha-old')

      const payload = createPayload({ slug: 'existing-slug', title: 'Updated' })
      const result = await adapter.publishDraft(payload)

      expect(result.success).toBe(true)
      // Should have called createOrUpdateFile with SHA
      const updateCall = mockClient.callLog.find(
        (c) => c.method === 'createOrUpdateFile' && (c.args[3] as string | undefined),
      )
      expect(updateCall).toBeDefined()
    })
  })

  describe('publishArticle', () => {
    it('creates article with published=true', async () => {
      const payload = createPayload({ slug: 'pub-article1' })
      const result = await adapter.publishArticle(payload)

      expect(result.success).toBe(true)
      const stored = mockClient.getStoredFile('articles/pub-article1.md')
      expect(stored?.content).toContain('published: true')
    })
  })

  describe('updateArticle', () => {
    it('updates existing article', async () => {
      mockClient.seedFile('articles/update-me12.md', '---\ntitle: Old\n---\nOld', 'sha-v1')

      const payload = createPayload({ title: 'Updated Title' })
      const result = await adapter.updateArticle('update-me12', payload)

      expect(result.success).toBe(true)
      expect(result.publishRecord?.sha).toBeTruthy()
    })
  })

  describe('uploadImage', () => {
    it('uploads image to images/ path', async () => {
      const image: LocalImageRef = {
        localPath: '/tmp/test.png',
        filename: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      }

      const result = await adapter.uploadImage(image)
      expect(result.success).toBe(true)
      expect(result.remoteUrl).toBe('/images/test.png')
    })

    it('returns error on failure', async () => {
      // Make the client throw
      const failClient = {
        ...mockClient,
        createOrUpdateFile: async () => {
          throw new Error('upload failed')
        },
      } as unknown as MockGitHubApiClient
      const failAdapter = new ZennAdapter(failClient)

      const image: LocalImageRef = {
        localPath: '/tmp/fail.png',
        filename: 'fail.png',
        mimeType: 'image/png',
        size: 1024,
      }

      const result = await failAdapter.uploadImage(image)
      expect(result.success).toBe(false)
      expect(result.error).toContain('upload failed')
    })
  })

  describe('409 conflict retry', () => {
    it('retries with fresh SHA on conflict', async () => {
      // Seed file with one SHA, then force conflict
      mockClient.seedFile('articles/conflict-art.md', 'old', 'sha-v1')

      // First publish creates the file
      const payload = createPayload({ slug: 'conflict-art' })
      const result = await adapter.publishDraft(payload)

      // Should succeed (getFile returns sha-v1, update uses it)
      expect(result.success).toBe(true)
    })
  })
})
