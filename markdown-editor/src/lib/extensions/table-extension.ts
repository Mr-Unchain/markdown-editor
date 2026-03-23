import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

/** テーブル関連エクステンションバンドル */
export const tableExtensions = [
  Table.configure({
    resizable: false,
  }),
  TableRow,
  TableCell,
  TableHeader,
]
