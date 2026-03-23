import { describe, it, expect } from 'vitest'
import { SANITIZER_CONFIG } from '../html-sanitizer'

// Note: sanitizeHTML requires a DOM environment (jsdom).
// These tests validate the config; integration tests with DOMPurify
// should run in a jsdom environment.

describe('html-sanitizer config', () => {
  describe('ALLOWED_TAGS', () => {
    it('includes standard markdown tags', () => {
      const { ALLOWED_TAGS } = SANITIZER_CONFIG
      expect(ALLOWED_TAGS).toContain('p')
      expect(ALLOWED_TAGS).toContain('h1')
      expect(ALLOWED_TAGS).toContain('h6')
      expect(ALLOWED_TAGS).toContain('code')
      expect(ALLOWED_TAGS).toContain('pre')
      expect(ALLOWED_TAGS).toContain('blockquote')
      expect(ALLOWED_TAGS).toContain('a')
      expect(ALLOWED_TAGS).toContain('img')
    })

    it('includes table tags', () => {
      const { ALLOWED_TAGS } = SANITIZER_CONFIG
      expect(ALLOWED_TAGS).toContain('table')
      expect(ALLOWED_TAGS).toContain('thead')
      expect(ALLOWED_TAGS).toContain('tbody')
      expect(ALLOWED_TAGS).toContain('tr')
      expect(ALLOWED_TAGS).toContain('td')
      expect(ALLOWED_TAGS).toContain('th')
    })

    it('includes Zenn-compatible tags', () => {
      const { ALLOWED_TAGS } = SANITIZER_CONFIG
      expect(ALLOWED_TAGS).toContain('div')
      expect(ALLOWED_TAGS).toContain('span')
      expect(ALLOWED_TAGS).toContain('figure')
      expect(ALLOWED_TAGS).toContain('figcaption')
    })

    it('includes checkbox input tag', () => {
      expect(SANITIZER_CONFIG.ALLOWED_TAGS).toContain('input')
    })

    it('does not include script or style', () => {
      const { ALLOWED_TAGS } = SANITIZER_CONFIG
      expect(ALLOWED_TAGS).not.toContain('script')
      expect(ALLOWED_TAGS).not.toContain('style')
      expect(ALLOWED_TAGS).not.toContain('iframe')
    })
  })

  describe('ALLOWED_ATTR', () => {
    it('includes data-language for code blocks', () => {
      expect(SANITIZER_CONFIG.ALLOWED_ATTR).toContain('data-language')
    })

    it('includes standard attributes', () => {
      const { ALLOWED_ATTR } = SANITIZER_CONFIG
      expect(ALLOWED_ATTR).toContain('href')
      expect(ALLOWED_ATTR).toContain('src')
      expect(ALLOWED_ATTR).toContain('alt')
      expect(ALLOWED_ATTR).toContain('class')
    })

    it('does not include event handlers', () => {
      const { ALLOWED_ATTR } = SANITIZER_CONFIG
      expect(ALLOWED_ATTR).not.toContain('onclick')
      expect(ALLOWED_ATTR).not.toContain('onerror')
      expect(ALLOWED_ATTR).not.toContain('onload')
    })
  })
})
