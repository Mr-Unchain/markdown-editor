import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SessionState } from '$lib/types/workspace'
import { type Result, ok, err, FileSystemError } from '$lib/types/filesystem'

export async function atomicWriteSession(
  sessionPath: string,
  data: SessionState,
  fs: FileSystemAdapter,
): Promise<Result<void>> {
  const bakPath = sessionPath + '.bak'
  const tmpPath = sessionPath + '.tmp'

  try {
    // 1. バックアップ（既存ファイルがある場合のみ）
    if (await fs.exists(sessionPath)) {
      await fs.copyFile(sessionPath, bakPath)
    }

    // 2. 一時ファイルに書き込み
    const json = JSON.stringify(data, null, 2)
    await fs.writeFile(tmpPath, json)

    // 3. アトミックリネーム
    await fs.rename(tmpPath, sessionPath)

    return ok(undefined)
  } catch (error) {
    // 一時ファイルのクリーンアップ試行
    try {
      if (await fs.exists(tmpPath)) {
        await fs.remove(tmpPath)
      }
    } catch {
      // クリーンアップ失敗は無視
    }

    return err(
      new FileSystemError(
        'IO_ERROR',
        `セッション保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        sessionPath,
      ),
    )
  }
}

export async function recoverSession(
  sessionPath: string,
  fs: FileSystemAdapter,
): Promise<Result<SessionState>> {
  const bakPath = sessionPath + '.bak'

  try {
    // メインファイルを試行
    if (await fs.exists(sessionPath)) {
      const content = await fs.readFile(sessionPath)
      return ok(JSON.parse(content) as SessionState)
    }

    // バックアップから復元
    if (await fs.exists(bakPath)) {
      const content = await fs.readFile(bakPath)
      const data = JSON.parse(content) as SessionState
      // バックアップをメインに昇格
      await fs.copyFile(bakPath, sessionPath)
      return ok(data)
    }

    return err(
      new FileSystemError('NOT_FOUND', 'セッションファイルが見つかりません', sessionPath),
    )
  } catch (error) {
    return err(
      new FileSystemError(
        'IO_ERROR',
        `セッション読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        sessionPath,
      ),
    )
  }
}
