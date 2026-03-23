import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  stringifyFrontmatter,
  getPublishRecords,
  findPublishRecord,
  upsertPublishRecord,
} from '../frontmatter-utils'

const SAMPLE_MD = `---
title: Test Article
emoji: "📝"
type: tech
topics:
  - svelte
  - typescript
published: false
---

# Hello World

This is content.`

const SAMPLE_WITH_RECORDS = `---
title: Published Article
publish_records:
  - platformId: zenn
    articleId: abc123
    slug: my-article
    publishedAt: "2026-03-20T00:00:00Z"
    updatedAt: "2026-03-20T00:00:00Z"
    sha: sha123
---

Content here.`

describe('frontmatter-utils', () => {
  describe('parseFrontmatter', () => {
    it('parses title, emoji, type, topics', async () => {
      const { content, data } = await parseFrontmatter(SAMPLE_MD)
      expect(data.title).toBe('Test Article')
      expect(data.emoji).toBe('📝')
      expect(data.type).toBe('tech')
      expect(data.topics).toEqual(['svelte', 'typescript'])
      expect(data.published).toBe(false)
      expect(content).toContain('# Hello World')
    })

    it('handles content without frontmatter', async () => {
      const { content, data } = await parseFrontmatter('# Just content')
      expect(content).toContain('# Just content')
      expect(Object.keys(data)).toHaveLength(0)
    })

    it('handles empty string', async () => {
      const { content, data } = await parseFrontmatter('')
      expect(content).toBe('')
      expect(Object.keys(data)).toHaveLength(0)
    })
  })

  describe('stringifyFrontmatter', () => {
    it('produces valid frontmatter markdown', async () => {
      const result = await stringifyFrontmatter('# Content', {
        title: 'New Article',
        type: 'tech',
      })
      expect(result).toContain('---')
      expect(result).toContain('title: New Article')
      expect(result).toContain('# Content')
    })
  })

  describe('getPublishRecords', () => {
    it('returns publish records from frontmatter', async () => {
      const records = await getPublishRecords(SAMPLE_WITH_RECORDS)
      expect(records).toHaveLength(1)
      expect(records[0].platformId).toBe('zenn')
      expect(records[0].articleId).toBe('abc123')
    })

    it('returns empty array when no records', async () => {
      const records = await getPublishRecords(SAMPLE_MD)
      expect(records).toEqual([])
    })
  })

  describe('findPublishRecord', () => {
    it('finds record by platformId', async () => {
      const record = await findPublishRecord(SAMPLE_WITH_RECORDS, 'zenn')
      expect(record).not.toBeNull()
      expect(record!.slug).toBe('my-article')
    })

    it('returns null for non-existent platform', async () => {
      const record = await findPublishRecord(SAMPLE_WITH_RECORDS, 'note')
      expect(record).toBeNull()
    })
  })

  describe('upsertPublishRecord', () => {
    it('adds new publish record', async () => {
      const result = await upsertPublishRecord(SAMPLE_MD, {
        platformId: 'zenn',
        articleId: 'new123',
        slug: 'new-article',
        publishedAt: '2026-03-23T00:00:00Z',
        updatedAt: '2026-03-23T00:00:00Z',
      })

      const records = await getPublishRecords(result)
      expect(records).toHaveLength(1)
      expect(records[0].articleId).toBe('new123')
    })

    it('updates existing publish record', async () => {
      const result = await upsertPublishRecord(SAMPLE_WITH_RECORDS, {
        platformId: 'zenn',
        articleId: 'abc123',
        slug: 'my-article',
        publishedAt: '2026-03-20T00:00:00Z',
        updatedAt: '2026-03-23T12:00:00Z',
        sha: 'sha-updated',
      })

      const records = await getPublishRecords(result)
      expect(records).toHaveLength(1)
      expect(records[0].updatedAt).toBe('2026-03-23T12:00:00Z')
      expect(records[0].sha).toBe('sha-updated')
    })
  })
})
