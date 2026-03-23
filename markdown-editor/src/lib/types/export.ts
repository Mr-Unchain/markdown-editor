// U4 Export types

export type ExportFormat = 'markdown' | 'html' | 'zenn'

export interface ExportResult {
  content: string
  format: ExportFormat
  filename?: string
}
