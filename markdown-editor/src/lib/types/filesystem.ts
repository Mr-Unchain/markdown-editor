export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: DirEntry[]
}

export interface FileContent {
  path: string
  content: string
  lastModified: number
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export type FileSystemErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ALREADY_EXISTS'
  | 'NOT_DIRECTORY'
  | 'NOT_FILE'
  | 'IO_ERROR'
  | 'UNKNOWN'

export class FileSystemError extends Error {
  constructor(
    public readonly code: FileSystemErrorCode,
    message: string,
    public readonly path?: string,
  ) {
    super(message)
    this.name = 'FileSystemError'
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: FileSystemError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T>(error: FileSystemError): Result<T> {
  return { ok: false, error }
}
