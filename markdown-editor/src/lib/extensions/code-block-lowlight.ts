import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

// 個別言語インポート（バンドルサイズ制御: ~65KB gzip）
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import shell from 'highlight.js/lib/languages/shell'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'

// lowlightインスタンス作成と言語登録
const lowlight = createLowlight()

lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('rust', rust)
lowlight.register('go', go)
lowlight.register('html', xml)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('yaml', yaml)
lowlight.register('shell', shell)
lowlight.register('markdown', markdown)
lowlight.register('sql', sql)
lowlight.register('java', java)
lowlight.register('c', c)
lowlight.register('cpp', cpp)

/** CodeBlockLowlight エクステンション（設定済み） */
export const configuredCodeBlockLowlight = CodeBlockLowlight.configure({
  lowlight,
  languageClassPrefix: 'language-',
  defaultLanguage: 'plaintext',
})

export { lowlight }
