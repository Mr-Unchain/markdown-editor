import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { PlatformAdapter, LocalImageRef, ImageUploadResult, ImageAsset } from '$lib/types/platform'
import { validateImage, validateImageBlob, getExtensionFromMime } from './image-validator'
import { generateImageFilename, buildImageLocalPath, buildMarkdownImageRef, getAssetsDir } from './image-naming'

export interface ImageInsertResult {
  success: boolean
  localPath?: string
  markdownRef?: string
  error?: string
}

/**
 * Image Manager (LC-U4-04)
 * Handles image insertion, local storage, and platform upload.
 */
export class ImageManager {
  constructor(private readonly fs: FileSystemAdapter) {}

  /**
   * Handle image drop event (US-17).
   */
  async handleDrop(event: DragEvent, markdownFilePath: string): Promise<ImageInsertResult[]> {
    const results: ImageInsertResult[] = []

    if (!event.dataTransfer?.files?.length) {
      return [{ success: false, error: '画像ファイルが見つかりません' }]
    }

    for (const file of Array.from(event.dataTransfer.files)) {
      const result = await this.insertFromFile(file, markdownFilePath)
      results.push(result)
    }

    return results
  }

  /**
   * Handle image paste event (US-17).
   */
  async handlePaste(event: ClipboardEvent, markdownFilePath: string): Promise<ImageInsertResult | null> {
    const items = event.clipboardData?.items
    if (!items) return null

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          return this.insertFromFile(blob, markdownFilePath)
        }
      }
    }

    return null
  }

  /**
   * Insert image from file (US-17).
   */
  async insertFromFile(file: File, markdownFilePath: string): Promise<ImageInsertResult> {
    // Validate
    const validation = validateImage(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    try {
      // Generate filename and save locally
      const filename = generateImageFilename(file.type)
      const localPath = buildImageLocalPath(markdownFilePath, filename)
      await this.saveToWorkspace(file, localPath)

      const markdownRef = buildMarkdownImageRef(markdownFilePath, filename)

      return {
        success: true,
        localPath,
        markdownRef,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '画像の保存に失敗しました',
      }
    }
  }

  /**
   * Save image data to workspace (local filesystem).
   */
  async saveToWorkspace(blob: Blob, targetPath: string): Promise<void> {
    // Ensure assets directory exists
    const dir = targetPath.substring(0, targetPath.lastIndexOf('/'))
    const dirExists = await this.fs.exists(dir)
    if (!dirExists) {
      await this.fs.mkdir(dir)
    }

    // Read blob as ArrayBuffer and write (Response wrapper for jsdom compat)
    const arrayBuffer = await new Response(blob).arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    await this.fs.writeBinaryFile(targetPath, uint8Array)
  }

  /**
   * Upload images for platform publishing (US-18).
   * Returns results for each image. Partial failures are allowed.
   */
  async uploadForPlatform(
    images: LocalImageRef[],
    adapter: PlatformAdapter,
    signal?: AbortSignal,
    onImageProgress?: (completed: number, total: number, currentFile: string) => void,
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = []

    for (let i = 0; i < images.length; i++) {
      if (signal?.aborted) {
        throw new Error('アップロードがキャンセルされました')
      }

      onImageProgress?.(i, images.length, images[i].localPath)

      try {
        const result = await adapter.uploadImage(images[i], signal)
        results.push(result)
      } catch (error) {
        results.push({
          localPath: images[i].localPath,
          remoteUrl: '',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return results
  }

  /**
   * Collect local image references from a markdown file's assets directory.
   */
  async collectLocalImages(markdownFilePath: string): Promise<LocalImageRef[]> {
    const assetsDir = getAssetsDir(markdownFilePath)
    const exists = await this.fs.exists(assetsDir)
    if (!exists) return []

    const entries = await this.fs.readDir(assetsDir)
    const images: LocalImageRef[] = []

    for (const entry of entries) {
      if (entry.isDirectory) continue

      const ext = entry.name.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
      }
      const mimeType = ext ? mimeMap[ext] : undefined
      if (!mimeType) continue

      images.push({
        localPath: entry.path,
        filename: entry.name,
        mimeType,
        size: 0, // Size would be populated by reading the file if needed
      })
    }

    return images
  }
}
