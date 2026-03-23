/**
 * HTML Sanitizer using DOMPurify (S-U4-02, P-U4-04)
 * Lazy-loaded to minimize initial bundle size.
 */

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'code', 'pre', 'blockquote', 'a', 'img',
  'em', 'strong', 'del', 'hr', 'br', 'input',
  'div', 'span', 'figure', 'figcaption',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'type', 'checked', 'align', 'data-language',
]

/** DOMPurify lazy-loaded cache */
let _purify: { sanitize: (html: string, config: object) => string } | null = null

async function getDOMPurify() {
  if (!_purify) {
    // DOMPurify requires a DOM environment
    // In Vitest, configure environment: 'jsdom' in vitest.config.ts
    if (typeof window === 'undefined') {
      throw new Error('DOMPurify requires a DOM environment. Configure jsdom in vitest.config.ts.')
    }
    const mod = await import('dompurify')
    _purify = (mod.default || mod) as typeof _purify
  }
  return _purify!
}

/**
 * Sanitize HTML content with whitelisted tags and attributes (NFR-U4-11).
 */
export async function sanitizeHTML(html: string): Promise<string> {
  const DOMPurify = await getDOMPurify()
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

/** Export config for testing */
export const SANITIZER_CONFIG = { ALLOWED_TAGS, ALLOWED_ATTR } as const
