import type { ArticlePayload } from '$lib/types/platform'
import type { FrontmatterData } from '$lib/integration/export/frontmatter-utils'

/**
 * Convert ArticlePayload to Zenn-compatible frontmatter data.
 */
export function toZennFrontmatter(article: ArticlePayload): FrontmatterData {
  return {
    title: article.title,
    emoji: article.emoji ?? '📝',
    type: article.articleType ?? 'tech',
    topics: article.tags ?? [],
    published: article.published ?? false,
  }
}

/**
 * Generate a Zenn-compatible slug (12 chars, lowercase alphanumeric + hyphen).
 */
export function generateZennSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)
  for (const byte of array) {
    slug += chars[byte % chars.length]
  }
  return slug
}

/**
 * Validate a Zenn slug format.
 */
export function isValidZennSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{10,}[a-z0-9]$/.test(slug) && slug.length >= 12 && slug.length <= 50
}

/**
 * Build the Zenn article file path from a slug.
 */
export function buildZennArticlePath(slug: string): string {
  return `articles/${slug}.md`
}

/**
 * Build the Zenn image file path.
 */
export function buildZennImagePath(filename: string): string {
  return `images/${filename}`
}
