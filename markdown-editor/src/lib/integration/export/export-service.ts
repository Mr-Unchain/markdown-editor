import { sanitizeHTML } from './html-sanitizer'
import type { ExportFormat, ExportResult } from '$lib/types/export'

/**
 * Export Service (LC-U4-05, NFR-U4-01, NFR-U4-06)
 * Converts editor content to various formats.
 * Works offline — no external dependencies for local conversion.
 */
export class ExportService {
  /**
   * Convert editor HTML to sanitized HTML string.
   */
  async toHTML(editorHTML: string): Promise<string> {
    return sanitizeHTML(editorHTML)
  }

  /**
   * Convert to markdown (pass-through — editor stores as markdown).
   */
  toMarkdown(markdown: string): string {
    return markdown
  }

  /**
   * Export to specified format.
   */
  async export(content: string, format: ExportFormat, editorHTML?: string): Promise<ExportResult> {
    switch (format) {
      case 'markdown':
        return { content: this.toMarkdown(content), format }
      case 'html':
        return { content: await this.toHTML(editorHTML ?? content), format }
      case 'zenn':
        // Zenn format is markdown — pass through
        return { content: this.toMarkdown(content), format: 'zenn' }
    }
  }

  /**
   * Copy content to clipboard as text (NFR-U4-06: works offline).
   */
  async copyToClipboardAsText(content: string): Promise<void> {
    await navigator.clipboard.writeText(content)
  }

  /**
   * Copy content to clipboard as rich text (HTML + text fallback).
   */
  async copyToClipboardAsRichText(html: string, plainText: string): Promise<void> {
    const htmlBlob = new Blob([html], { type: 'text/html' })
    const textBlob = new Blob([plainText], { type: 'text/plain' })
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      }),
    ])
  }

  /**
   * Download content as a file.
   */
  async downloadAsFile(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}
