import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import { Markdown } from '@tiptap/markdown'
import { configuredCodeBlockLowlight } from '$lib/extensions/code-block-lowlight'
import { tableExtensions } from '$lib/extensions/table-extension'
import { configuredLink } from '$lib/extensions/link-extension'
import { SlashCommand } from '$lib/extensions/slash-command-extension'
import { safeRegisterExtensions } from './extension-registry'
import { getMarkdownFromEditor, setMarkdownToEditor } from './markdown-converter'
import { SLASH_COMMAND_ITEMS, filterSlashCommands } from './slash-commands'
import { setSaveStatus } from '$lib/stores/save-status.svelte'
import { notify } from '$lib/stores/notifications.svelte'
import type { EditorOptions as AppEditorOptions, EditorState, ActiveFormats } from '$lib/types/editor'
import { DEFAULT_ACTIVE_FORMATS } from '$lib/types/editor'
import type { SlashCommandItem } from '$lib/types/slash-command'

const AUTOSAVE_DEBOUNCE_MS = 1000

export interface EditorCoreCallbacks {
  onStateChange?: (state: EditorState) => void
  onSave?: (markdown: string) => Promise<boolean>
}

/**
 * EditorCore: Tiptapエディターの初期化・状態管理・自動保存を担当
 */
export class EditorCore {
  private editor: Editor | null = null
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private callbacks: EditorCoreCallbacks = {}
  private bubbleMenuElement: HTMLElement | null = null

  /**
   * エディターを初期化する
   */
  initialize(
    container: HTMLElement,
    options: AppEditorOptions = {},
    callbacks: EditorCoreCallbacks = {},
    bubbleMenuEl?: HTMLElement,
  ): { failed: string[] } {
    this.callbacks = callbacks
    this.bubbleMenuElement = bubbleMenuEl ?? null

    // コアエクステンション（失敗=起動中止）
    const coreExtensions = [
      StarterKit.configure({
        codeBlock: false, // CodeBlockLowlightで置換
      }),
    ]

    // オプショナルエクステンション（失敗=機能縮退で継続）
    const optionalExtensions = [
      ...tableExtensions,
      TaskList,
      TaskItem.configure({ nested: true }),
      configuredCodeBlockLowlight,
      configuredLink,
      Placeholder.configure({
        placeholder: options.placeholder ?? 'タイトルを入力...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }: { query: string }) => filterSlashCommands(SLASH_COMMAND_ITEMS, query),
          render: () => this.createSlashCommandRenderer(),
        },
      }),
      ...(this.bubbleMenuElement
        ? [BubbleMenu.configure({ element: this.bubbleMenuElement })]
        : []),
    ]

    const { extensions, failed } = safeRegisterExtensions(coreExtensions, optionalExtensions)

    if (failed.length > 0) {
      notify('warning', `${failed.join(', ')}の読み込みに失敗しました`)
    }

    this.editor = new Editor({
      element: container,
      extensions,
      content: options.content ?? '',
      editable: options.editable ?? true,
      onUpdate: ({ editor }) => {
        this.handleUpdate(editor)
      },
      onSelectionUpdate: ({ editor }) => {
        this.emitStateChange(editor)
      },
      onTransaction: ({ editor }) => {
        this.emitStateChange(editor)
      },
    })

    return { failed }
  }

  /**
   * エディターを破棄する
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    this.editor?.destroy()
    this.editor = null
  }

  /**
   * Markdownコンテンツを設定する
   */
  setContent(markdown: string): boolean {
    if (!this.editor) return false
    const result = setMarkdownToEditor(this.editor, markdown)
    if (!result.ok) {
      notify('error', result.error ?? 'ファイルの読み込みに失敗しました')
    }
    return result.ok
  }

  /**
   * 現在のドキュメントをMarkdownとして取得する
   */
  getMarkdown(): string | null {
    if (!this.editor) return null
    const result = getMarkdownFromEditor(this.editor)
    if (!result.ok) {
      notify('error', result.error ?? 'Markdown変換に失敗しました')
      return null
    }
    return result.data ?? ''
  }

  /**
   * Tiptap Editor インスタンスを取得する
   */
  getEditor(): Editor | null {
    return this.editor
  }

  /**
   * 現在のアクティブフォーマットを取得する
   */
  getActiveFormats(): ActiveFormats {
    if (!this.editor) return { ...DEFAULT_ACTIVE_FORMATS }

    const editor = this.editor
    let headingLevel: false | 1 | 2 | 3 | 4 | 5 | 6 = false
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      if (editor.isActive('heading', { level })) {
        headingLevel = level
        break
      }
    }

    return {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      heading: headingLevel,
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      taskList: editor.isActive('taskList'),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
      link: editor.isActive('link'),
    }
  }

  /**
   * エディターの状態を取得する
   */
  getEditorState(): EditorState {
    if (!this.editor) {
      return {
        editor: null,
        isEmpty: true,
        canUndo: false,
        canRedo: false,
        activeFormats: { ...DEFAULT_ACTIVE_FORMATS },
      }
    }

    return {
      editor: this.editor,
      isEmpty: this.editor.isEmpty,
      canUndo: this.editor.can().undo(),
      canRedo: this.editor.can().redo(),
      activeFormats: this.getActiveFormats(),
    }
  }

  // --- Private methods ---

  private handleUpdate(editor: Editor): void {
    setSaveStatus('unsaved')
    this.emitStateChange(editor)
    this.scheduleAutoSave()
  }

  private emitStateChange(editor: Editor): void {
    if (!this.callbacks.onStateChange) return
    this.callbacks.onStateChange({
      editor,
      isEmpty: editor.isEmpty,
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      activeFormats: this.getActiveFormats(),
    })
  }

  private scheduleAutoSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.autoSave(), AUTOSAVE_DEBOUNCE_MS)
  }

  private async autoSave(): Promise<void> {
    const markdown = this.getMarkdown()
    if (markdown === null) {
      setSaveStatus('error')
      return
    }

    if (this.callbacks.onSave) {
      setSaveStatus('saving')
      const success = await this.callbacks.onSave(markdown)
      setSaveStatus(success ? 'saved' : 'error')
    }
  }

  /**
   * スラッシュコマンドのレンダラーを作成する（tippy.jsを使用）
   * SlashCommandPaletteコンポーネントの動的マウント用
   */
  private createSlashCommandRenderer() {
    let component: {
      element: HTMLElement
      updateProps: (props: { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }) => void
      destroy: () => void
    } | null = null

    return {
      onStart: (props: { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void; clientRect: (() => DOMRect | null) | null }) => {
        const el = document.createElement('div')
        el.className = 'slash-command-container'
        el.setAttribute('data-testid', 'slash-command-palette')

        // SlashCommandPaletteはStep 12で実装
        // ここではDOMコンテナの準備のみ
        component = {
          element: el,
          updateProps: () => {},
          destroy: () => {
            el.remove()
          },
        }

        document.body.appendChild(el)

        // 位置計算
        if (props.clientRect) {
          const rect = props.clientRect()
          if (rect) {
            el.style.position = 'fixed'
            el.style.left = `${rect.left}px`
            el.style.top = `${rect.bottom}px`
            el.style.zIndex = '1000'
          }
        }
      },
      onUpdate: (props: { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }) => {
        component?.updateProps(props)
      },
      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          component?.destroy()
          component = null
          return true
        }
        return false
      },
      onExit: () => {
        component?.destroy()
        component = null
      },
    }
  }
}
