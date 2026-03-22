import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

/** テーブル関連エクステンションバンドル */
export const tableExtensions = [
  Table.configure({
    resizable: false,
  }),
  TableRow,
  TableCell,
  TableHeader,
]
