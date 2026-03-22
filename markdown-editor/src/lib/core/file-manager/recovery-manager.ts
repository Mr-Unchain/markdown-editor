import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { RecoveryFile } from '$lib/types/file-manager'
import type { Tab } from '$lib/types/workspace'

const RECOVERY_DIR = '.markdown-editor-recovery'
const INTERVAL_MS = 30_000

export class RecoveryManager {
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor(
    private fs: FileSystemAdapter,
    private getDirtyTabs: () => Tab[],
  ) {}

  start(workspacePath: string): void {
    this.stop()
    this.intervalId = setInterval(() => {
      this.writeRecoveryFiles(workspacePath).catch(() => {
        // リカバリファイル書き込みエラーは静かに無視
      })
    }, INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async checkAndRecover(workspacePath: string): Promise<RecoveryFile[]> {
    const recoveryDir = `${workspacePath}/${RECOVERY_DIR}`

    if (!(await this.fs.exists(recoveryDir))) {
      return []
    }

    const entries = await this.fs.readDir(recoveryDir)
    const recoveryFiles: RecoveryFile[] = []

    for (const entry of entries) {
      if (entry.name.endsWith('.recovery')) {
        try {
          const content = await this.fs.readFile(entry.path)
          const metadata = JSON.parse(content) as {
            originalPath: string
            content: string
            timestamp: number
          }
          recoveryFiles.push({
            originalPath: metadata.originalPath,
            recoveryPath: entry.path,
            content: metadata.content,
            timestamp: metadata.timestamp,
          })
        } catch {
          // 不正なリカバリファイルは無視
        }
      }
    }

    return recoveryFiles
  }

  async applyRecovery(recoveryFile: RecoveryFile): Promise<void> {
    // リカバリファイルの内容を使用してタブ復元（呼び出し元で処理）
    await this.removeRecoveryFile(recoveryFile.recoveryPath)
  }

  async cleanup(workspacePath: string, filePath?: string): Promise<void> {
    const recoveryDir = `${workspacePath}/${RECOVERY_DIR}`

    if (!(await this.fs.exists(recoveryDir))) return

    if (filePath) {
      // 特定ファイルのリカバリを削除
      const safeName = this.toSafeFileName(filePath)
      const recoveryPath = `${recoveryDir}/${safeName}.recovery`
      if (await this.fs.exists(recoveryPath)) {
        await this.fs.remove(recoveryPath)
      }
    } else {
      // 全リカバリファイルを削除
      await this.fs.removeDir(recoveryDir, { recursive: true })
    }
  }

  private async writeRecoveryFiles(workspacePath: string): Promise<void> {
    const dirtyTabs = this.getDirtyTabs()
    if (dirtyTabs.length === 0) return

    const recoveryDir = `${workspacePath}/${RECOVERY_DIR}`
    if (!(await this.fs.exists(recoveryDir))) {
      await this.fs.mkdir(recoveryDir)
    }

    for (const tab of dirtyTabs) {
      if (tab.content === null) continue

      const safeName = this.toSafeFileName(tab.filePath)
      const recoveryPath = `${recoveryDir}/${safeName}.recovery`
      const data = JSON.stringify({
        originalPath: tab.filePath,
        content: tab.content,
        timestamp: Date.now(),
      })
      await this.fs.writeFile(recoveryPath, data)
    }
  }

  private async removeRecoveryFile(path: string): Promise<void> {
    if (await this.fs.exists(path)) {
      await this.fs.remove(path)
    }
  }

  private toSafeFileName(filePath: string): string {
    return filePath.replace(/[/\\:]/g, '_')
  }

  get isRunning(): boolean {
    return this.intervalId !== null
  }
}
