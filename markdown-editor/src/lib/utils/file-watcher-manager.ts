import type { FileSystemAdapter, UnwatchFn } from '$lib/infrastructure/filesystem/types'
import type { WatchEvent } from '$lib/types/file-manager'

export type TreeChangeHandler = (event: WatchEvent) => void
export type TabChangeHandler = (filePath: string, event: WatchEvent) => void

export class FileWatcherManager {
  private workspaceWatcher: UnwatchFn | null = null
  private tabWatchers = new Map<string, UnwatchFn>()
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly DEBOUNCE_MS = 500

  constructor(
    private fs: FileSystemAdapter,
    private onTreeChange: TreeChangeHandler,
    private onTabChange: TabChangeHandler,
  ) {}

  async startWorkspaceWatch(rootPath: string): Promise<void> {
    await this.stopWorkspaceWatch()

    this.workspaceWatcher = await this.fs.watch(
      rootPath,
      (event) => {
        this.debounce('workspace', () => this.onTreeChange(event))
      },
      { recursive: true, debounceMs: this.DEBOUNCE_MS },
    )
  }

  async watchTabFile(filePath: string): Promise<void> {
    if (this.tabWatchers.has(filePath)) return

    const unwatch = await this.fs.watch(
      filePath,
      (event) => {
        this.debounce(`tab:${filePath}`, () => this.onTabChange(filePath, event))
      },
      { recursive: false, debounceMs: this.DEBOUNCE_MS },
    )

    this.tabWatchers.set(filePath, unwatch)
  }

  async unwatchTabFile(filePath: string): Promise<void> {
    const unwatch = this.tabWatchers.get(filePath)
    if (unwatch) {
      await unwatch()
      this.tabWatchers.delete(filePath)
    }
    this.clearDebounce(`tab:${filePath}`)
  }

  async stopAll(): Promise<void> {
    await this.stopWorkspaceWatch()

    for (const [filePath, unwatch] of this.tabWatchers) {
      await unwatch()
      this.clearDebounce(`tab:${filePath}`)
    }
    this.tabWatchers.clear()

    // Clear all remaining timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
  }

  private async stopWorkspaceWatch(): Promise<void> {
    if (this.workspaceWatcher) {
      await this.workspaceWatcher()
      this.workspaceWatcher = null
    }
    this.clearDebounce('workspace')
  }

  private debounce(key: string, fn: () => void): void {
    this.clearDebounce(key)
    const timer = setTimeout(fn, this.DEBOUNCE_MS)
    this.debounceTimers.set(key, timer)
  }

  private clearDebounce(key: string): void {
    const timer = this.debounceTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(key)
    }
  }

  get watchedTabCount(): number {
    return this.tabWatchers.size
  }

  get isWorkspaceWatching(): boolean {
    return this.workspaceWatcher !== null
  }
}
