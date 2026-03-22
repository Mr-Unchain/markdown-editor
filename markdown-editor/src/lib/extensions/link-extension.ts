import Link from '@tiptap/extension-link'

/** Link エクステンション（設定済み） */
export const configuredLink = Link.configure({
  autolink: true,
  openOnClick: false,
  HTMLAttributes: {
    rel: 'noopener noreferrer',
  },
})
