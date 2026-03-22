<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import '../components/editor/editor.css'
  import { EditorCore } from '$lib/core/editor/editor-core'
  import type { EditorState } from '$lib/types/editor'
  import { DEFAULT_EDITOR_STATE } from '$lib/types/editor'
  import { setSaveStatus } from '$lib/stores/save-status.svelte'
  import FixedToolbar from '../components/editor/FixedToolbar.svelte'
  import EditorContainer from '../components/editor/EditorContainer.svelte'
  import BubbleToolbar from '../components/editor/BubbleToolbar.svelte'
  import AriaLiveRegion from '../components/editor/AriaLiveRegion.svelte'
  import TableControls from '../components/editor/TableControls.svelte'

  let editorCore = new EditorCore()
  let editorState = $state<EditorState>({ ...DEFAULT_EDITOR_STATE })
  let ariaMessage = $state('')
  let containerEl: HTMLElement | undefined = $state()
  let bubbleMenuEl: HTMLElement | undefined = $state()

  let lastFormats = $state({ ...DEFAULT_EDITOR_STATE.activeFormats })

  onMount(() => {
    if (!containerEl) return

    const { failed } = editorCore.initialize(
      containerEl,
      { placeholder: 'タイトルを入力...' },
      {
        onStateChange: (state) => {
          editorState = state

          // 書式変更をアナウンス（A-U2-03）
          announceFormatChanges(state)
        },
        onSave: async (markdown) => {
          // U3 FileManager実装後に接続
          setSaveStatus('saved')
          return true
        },
      },
      bubbleMenuEl,
    )
  })

  onDestroy(() => {
    editorCore.destroy()
  })

  function announceFormatChanges(state: EditorState) {
    const formats = state.activeFormats
    const formatNames: Record<string, string> = {
      bold: '太字',
      italic: '斜体',
      strike: '取り消し線',
      code: 'インラインコード',
      bulletList: '箇条書きリスト',
      orderedList: '番号付きリスト',
      taskList: 'チェックリスト',
      blockquote: '引用',
      codeBlock: 'コードブロック',
      link: 'リンク',
    }

    for (const [key, label] of Object.entries(formatNames)) {
      const k = key as keyof typeof formats
      const prev = lastFormats[k]
      const curr = formats[k]
      if (prev !== curr && typeof curr === 'boolean') {
        ariaMessage = curr ? `${label}を適用しました` : `${label}を解除しました`
      }
    }

    if (formats.heading !== lastFormats.heading) {
      if (formats.heading) {
        ariaMessage = `見出し${formats.heading}を適用しました`
      } else {
        ariaMessage = 'テキストに戻しました'
      }
    }

    lastFormats = { ...formats }
  }
</script>

<div class="editor-page" data-testid="editor-page">
  <FixedToolbar
    editor={editorState.editor}
    activeFormats={editorState.activeFormats}
    canUndo={editorState.canUndo}
    canRedo={editorState.canRedo}
  />

  <div class="editor-main">
    <BubbleToolbar editor={editorState.editor} bind:element={bubbleMenuEl} />
    <EditorContainer bind:element={containerEl} />
    <TableControls editor={editorState.editor} />
  </div>

  <AriaLiveRegion message={ariaMessage} />
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .editor-main {
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  :global(.editor-content) {
    min-height: 300px;
    padding: 1rem;
    outline: none;
  }

  :global(.editor-content .ProseMirror) {
    min-height: 300px;
    outline: none;
  }

  :global(.editor-content .ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--color-text, #999);
    opacity: 0.4;
    pointer-events: none;
    height: 0;
  }
</style>
