import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportService } from '../export-service'

// Mock html-sanitizer to avoid DOMPurify dependency in tests
vi.mock('../html-sanitizer', () => ({
  sanitizeHTML: vi.fn(async (html: string) => html.replace(/<script[^>]*>.*?<\/script>/gi, '')),
}))

describe('ExportService', () => {
  let service: ExportService

  beforeEach(() => {
    service = new ExportService()
  })

  describe('toMarkdown', () => {
    it('returns markdown as-is', () => {
      const md = '# Hello\n\nWorld'
      expect(service.toMarkdown(md)).toBe(md)
    })
  })

  describe('toHTML', () => {
    it('returns sanitized HTML', async () => {
      const html = '<p>Hello</p><script>alert("xss")</script>'
      const result = await service.toHTML(html)
      expect(result).toContain('<p>Hello</p>')
      expect(result).not.toContain('<script>')
    })
  })

  describe('export', () => {
    it('exports as markdown', async () => {
      const result = await service.export('# Hello', 'markdown')
      expect(result.format).toBe('markdown')
      expect(result.content).toBe('# Hello')
    })

    it('exports as html', async () => {
      const result = await service.export('# Hello', 'html', '<h1>Hello</h1>')
      expect(result.format).toBe('html')
      expect(result.content).toContain('<h1>Hello</h1>')
    })

    it('exports as zenn (markdown pass-through)', async () => {
      const result = await service.export('# Hello', 'zenn')
      expect(result.format).toBe('zenn')
      expect(result.content).toBe('# Hello')
    })
  })

  describe('copyToClipboardAsText', () => {
    it('calls clipboard.writeText', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      await service.copyToClipboardAsText('hello')
      expect(writeText).toHaveBeenCalledWith('hello')
    })
  })
})
