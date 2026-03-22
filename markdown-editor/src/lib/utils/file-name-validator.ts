import type { ValidationResult } from '$lib/types/file-manager'

const FORBIDDEN_CHARS = /[\\/:*?"<>|]/
const CONTROL_CHARS = /[\x00-\x1f]/
const RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
])
const MAX_NAME_LENGTH = 255
const MAX_PATH_LENGTH = 260

export function validateFileName(name: string, parentPath: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'EMPTY', message: 'ファイル名を入力してください' }
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { isValid: false, error: 'TOO_LONG', message: `ファイル名が長すぎます（最大${MAX_NAME_LENGTH}文字）` }
  }

  if (FORBIDDEN_CHARS.test(name)) {
    return { isValid: false, error: 'INVALID_CHARS', message: '使用できない文字が含まれています: \\ / : * ? " < > |' }
  }

  if (CONTROL_CHARS.test(name)) {
    return { isValid: false, error: 'INVALID_CHARS', message: '制御文字は使用できません' }
  }

  if (name.startsWith(' ') || name.endsWith(' ')) {
    return { isValid: false, error: 'INVALID_CHARS', message: '先頭・末尾にスペースは使用できません' }
  }

  if (name.startsWith('.') || name.endsWith('.')) {
    return { isValid: false, error: 'INVALID_CHARS', message: '先頭・末尾にドットは使用できません' }
  }

  const baseName = name.replace(/\.[^.]*$/, '').toUpperCase()
  if (RESERVED_NAMES.has(baseName)) {
    return { isValid: false, error: 'RESERVED_NAME', message: 'この名前はシステムで予約されています' }
  }

  const fullPath = parentPath + '/' + name
  if (fullPath.length > MAX_PATH_LENGTH) {
    return { isValid: false, error: 'PATH_TOO_LONG', message: `パス全体が長すぎます（最大${MAX_PATH_LENGTH}文字）` }
  }

  return { isValid: true }
}

export function generateUniqueName(
  baseName: string,
  existingNames: Set<string>,
): string {
  if (!existingNames.has(baseName)) return baseName

  const dotIndex = baseName.lastIndexOf('.')
  const nameWithoutExt = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName
  const ext = dotIndex > 0 ? baseName.slice(dotIndex) : ''

  for (let i = 1; i <= 99; i++) {
    const candidate = `${nameWithoutExt}(${i})${ext}`
    if (!existingNames.has(candidate)) return candidate
  }

  return `${nameWithoutExt}(99)${ext}`
}

export function getFileType(fileName: string): 'markdown' | 'plaintext' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return ext === 'md' || ext === 'mdx' ? 'markdown' : 'plaintext'
}

export function containsNullByte(data: Uint8Array): boolean {
  return data.includes(0x00)
}
