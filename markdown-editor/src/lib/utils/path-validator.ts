import { FileSystemError, type Result, ok, err } from '$lib/types/filesystem'

export class PathValidator {
  private workspaceRoot: string

  constructor(workspaceRoot: string) {
    this.workspaceRoot = normalizePath(workspaceRoot)
  }

  updateRoot(workspaceRoot: string): void {
    this.workspaceRoot = normalizePath(workspaceRoot)
  }

  validatePath(targetPath: string): Result<string> {
    const normalized = normalizePath(targetPath)

    if (targetPath.includes('..')) {
      return err(
        new FileSystemError(
          'PERMISSION_DENIED',
          '相対パスの上位参照は許可されていません',
          targetPath,
        ),
      )
    }

    if (
      normalized !== this.workspaceRoot &&
      !normalized.startsWith(this.workspaceRoot + '/')
    ) {
      return err(
        new FileSystemError(
          'PERMISSION_DENIED',
          'ワークスペース外のパスにはアクセスできません',
          targetPath,
        ),
      )
    }

    const adsResult = this.validateNoADS(targetPath)
    if (!adsResult.ok) return adsResult as Result<string>

    return ok(normalized)
  }

  validateNoADS(targetPath: string): Result<void> {
    // Windows Alternate Data Streams: path contains ':' but not drive letter
    const withoutDrive = targetPath.replace(/^[A-Za-z]:/, '')
    if (withoutDrive.includes(':')) {
      return err(
        new FileSystemError(
          'PERMISSION_DENIED',
          '代替データストリームは許可されていません',
          targetPath,
        ),
      )
    }
    return ok(undefined)
  }

  isWithinWorkspace(targetPath: string): boolean {
    const normalized = normalizePath(targetPath)
    return (
      normalized === this.workspaceRoot ||
      normalized.startsWith(this.workspaceRoot + '/')
    )
  }

  getRelativePath(absolutePath: string): string {
    const normalized = normalizePath(absolutePath)
    if (normalized === this.workspaceRoot) return ''
    return normalized.slice(this.workspaceRoot.length + 1)
  }
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+$/, '')
}
