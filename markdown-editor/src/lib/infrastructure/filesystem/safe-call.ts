import { FileSystemError, type FileSystemErrorCode, type Result } from '$lib/types/filesystem'

export function toFileSystemError(e: unknown, path?: string): FileSystemError {
  if (e instanceof FileSystemError) return e

  const message = e instanceof Error ? e.message : String(e)
  let code: FileSystemErrorCode = 'UNKNOWN'

  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('not found') || lowerMessage.includes('no such file')) {
    code = 'NOT_FOUND'
  } else if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
    code = 'PERMISSION_DENIED'
  } else if (lowerMessage.includes('already exists') || lowerMessage.includes('exist')) {
    code = 'ALREADY_EXISTS'
  }

  return new FileSystemError(code, message, path)
}

export async function safeCall<T>(fn: () => Promise<T>, path?: string): Promise<Result<T>> {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (e) {
    const error = toFileSystemError(e, path)
    console.error(`[FS] ${error.code}: ${error.message}`, error.path)
    return { ok: false, error }
  }
}
