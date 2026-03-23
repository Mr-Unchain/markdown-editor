import { type PublishError, GitHubApiError } from '$lib/types/platform'

/**
 * Structured error message pattern (A-U4-02, NFR-U4-14)
 * Every user-facing error has: what, why, action.
 */
export interface UserFriendlyError {
  what: string
  why: string
  action: string
}

type ErrorMapper = (details?: string) => UserFriendlyError

const ERROR_MAP: Record<string, ErrorMapper> = {
  'github-401': () => ({
    what: 'Zennへの投稿に失敗しました',
    why: 'GitHub Tokenが無効または期限切れです',
    action: '設定画面からトークンを更新してください',
  }),
  'github-403': () => ({
    what: 'GitHubリポジトリへのアクセスが拒否されました',
    why: 'トークンの権限が不足しているか、リポジトリへのアクセス権がありません',
    action: '設定画面でトークンの権限を確認してください',
  }),
  'github-404': () => ({
    what: 'Zennリポジトリが見つかりません',
    why: '設定されたリポジトリが存在しないか、アクセス権がありません',
    action: '設定画面でリポジトリ名を確認してください',
  }),
  'github-409': () => ({
    what: '記事ファイルの更新に競合が発生しました',
    why: '他の場所（Zenn CLI等）から同じ記事が更新されています',
    action: '再試行してください。問題が続く場合はZenn上で記事を確認してください',
  }),
  'github-422': () => ({
    what: 'リクエストが不正です',
    why: '送信したデータに問題があります',
    action: '入力内容を確認して再試行してください',
  }),
  'github-rate-limit': (resetTime) => ({
    what: 'GitHub APIのレート制限に達しました',
    why: '短時間に多くのリクエストを送信しました',
    action: `${resetTime ?? '数分'}後に再試行可能です`,
  }),
  'network-error': () => ({
    what: '通信エラーが発生しました',
    why: 'インターネット接続が不安定です',
    action: 'ネットワーク接続を確認して再試行してください',
  }),
  'image-upload-failed': (filename) => ({
    what: `画像のアップロードに失敗しました: ${filename ?? '不明'}`,
    why: 'ネットワークエラーまたはファイルサイズ超過の可能性があります',
    action: '再試行するか、画像を小さくしてからお試しください',
  }),
  'image-too-large': (filename) => ({
    what: `画像ファイルが大きすぎます: ${filename ?? '不明'}`,
    why: '画像サイズが5MBを超えています',
    action: '画像を圧縮してから再試行してください',
  }),
  'image-invalid-type': (filename) => ({
    what: `サポートされていない画像形式です: ${filename ?? '不明'}`,
    why: '対応形式はPNG, JPG, GIF, WebPです',
    action: '対応形式の画像を使用してください',
  }),
  'publish-timeout': () => ({
    what: '投稿処理がタイムアウトしました',
    why: '処理に5分以上かかりました',
    action: 'ネットワーク接続を確認して再試行してください',
  }),
  'publish-cancelled': () => ({
    what: '投稿がキャンセルされました',
    why: 'ユーザーによりキャンセルされました',
    action: '必要に応じて再度投稿してください',
  }),
  'duplicate-publish': () => ({
    what: 'この記事は既に投稿されています',
    why: 'frontmatterに投稿記録があります',
    action: '更新として投稿するか、新しいslugで投稿してください',
  }),
}

/**
 * Classify an error into a known error key.
 */
export function classifyError(error: Error): string {
  if (error instanceof GitHubApiError) {
    if (error.status === 429 || error.rateLimitReset) return 'github-rate-limit'
    return `github-${error.status}`
  }

  if (error.name === 'PublishCancelledError') return 'publish-cancelled'
  if (error.name === 'AbortError' || error.message?.includes('timeout')) return 'publish-timeout'
  if (error.message?.includes('network') || error.message?.includes('fetch')) return 'network-error'

  return 'unknown'
}

/**
 * Format a publish error into a user-friendly message string (LC-U4-12).
 */
export function formatErrorMessage(error: Error, details?: string): string {
  const key = classifyError(error)
  const mapper = ERROR_MAP[key]

  if (mapper) {
    const msg = mapper(details)
    return `${msg.what}\n${msg.why}\n${msg.action}`
  }

  return `エラーが発生しました: ${error.message}`
}

/**
 * Get structured error info (for UI components that display what/why/action separately).
 */
export function getStructuredError(error: Error, details?: string): UserFriendlyError {
  const key = classifyError(error)
  const mapper = ERROR_MAP[key]

  if (mapper) return mapper(details)

  return {
    what: 'エラーが発生しました',
    why: error.message,
    action: '再試行してください',
  }
}
