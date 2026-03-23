import type { PublishRecord } from '$lib/types/platform'

/** gray-matter lazy-loaded module cache (P-U4-04) */
let _matter: typeof import('gray-matter').default | null = null

async function getMatter() {
  if (!_matter) {
    const mod = await import('gray-matter')
    _matter = mod.default || (mod as unknown as { default: typeof import('gray-matter').default }).default
  }
  return _matter
}

/** js-yaml 4.x lazy-loaded for engine override (security: CVE mitigation) */
let _yaml: typeof import('js-yaml') | null = null

async function getYaml() {
  if (!_yaml) {
    _yaml = await import('js-yaml')
  }
  return _yaml
}

export interface FrontmatterData {
  [key: string]: unknown
  title?: string
  emoji?: string
  type?: string
  topics?: string[]
  published?: boolean
  publish_records?: PublishRecord[]
}

export interface ParsedFrontmatter {
  content: string
  data: FrontmatterData
}

/**
 * Parse frontmatter from markdown content (LC-U4-09)
 * Uses gray-matter with js-yaml 4.x engine override for security.
 */
export async function parseFrontmatter(markdownContent: string): Promise<ParsedFrontmatter> {
  const matter = await getMatter()
  const yaml = await getYaml()

  const result = matter(markdownContent, {
    engines: {
      yaml: {
        parse: (str: string) => yaml.load(str) as Record<string, unknown>,
        stringify: (obj: Record<string, unknown>) => yaml.dump(obj),
      },
    },
  })

  return {
    content: result.content,
    data: result.data as FrontmatterData,
  }
}

/**
 * Serialize content with frontmatter.
 */
export async function stringifyFrontmatter(content: string, data: FrontmatterData): Promise<string> {
  const matter = await getMatter()
  const yaml = await getYaml()

  return matter.stringify(content, data, {
    engines: {
      yaml: {
        parse: (str: string) => yaml.load(str) as Record<string, unknown>,
        stringify: (obj: Record<string, unknown>) => yaml.dump(obj),
      },
    },
  })
}

/**
 * Read publish records from frontmatter.
 */
export async function getPublishRecords(markdownContent: string): Promise<PublishRecord[]> {
  const { data } = await parseFrontmatter(markdownContent)
  return data.publish_records ?? []
}

/**
 * Find an existing publish record for a specific platform.
 */
export async function findPublishRecord(
  markdownContent: string,
  platformId: string,
): Promise<PublishRecord | null> {
  const records = await getPublishRecords(markdownContent)
  return records.find((r) => r.platformId === platformId) ?? null
}

/**
 * Add or update a publish record in frontmatter.
 */
export async function upsertPublishRecord(
  markdownContent: string,
  record: PublishRecord,
): Promise<string> {
  const { content, data } = await parseFrontmatter(markdownContent)
  const records = data.publish_records ?? []
  const existingIndex = records.findIndex((r) => r.platformId === record.platformId)

  if (existingIndex >= 0) {
    records[existingIndex] = record
  } else {
    records.push(record)
  }

  data.publish_records = records
  return stringifyFrontmatter(content, data)
}
