export interface LinkValidationResult {
  valid: boolean
  sanitized: string
}

/** 危険なプロトコルパターン */
const DANGEROUS_PROTOCOL = /^(javascript|data|vbscript):/i

/**
 * リンクURLをバリデーションする（S-U2-02）
 * - javascript:, data:, vbscript: を拒否
 * - プロトコルなしの場合は https:// を付与
 */
export function validateLinkUrl(url: string): LinkValidationResult {
  const trimmed = url.trim()

  if (!trimmed) {
    return { valid: false, sanitized: '' }
  }

  if (DANGEROUS_PROTOCOL.test(trimmed)) {
    return { valid: false, sanitized: '' }
  }

  // 相対パスやハッシュリンクはそのまま許可
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return { valid: true, sanitized: trimmed }
  }

  // mailto: は許可
  if (trimmed.startsWith('mailto:')) {
    return { valid: true, sanitized: trimmed }
  }

  // プロトコルなしの場合は https:// を付与
  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: true, sanitized: `https://${trimmed}` }
  }

  return { valid: true, sanitized: trimmed }
}
