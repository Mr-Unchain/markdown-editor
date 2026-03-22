<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { ActiveFormats } from '$lib/types/editor'
  import { handleRovingTabindex, initRovingTabindex } from '$lib/utils/keyboard-navigation'
  import FormatButtonGroup from './FormatButtonGroup.svelte'
  import HeadingDropdown from './HeadingDropdown.svelte'
  import ListButtonGroup from './ListButtonGroup.svelte'
  import InsertButtonGroup from './InsertButtonGroup.svelte'
  import UndoRedoButtons from './UndoRedoButtons.svelte'
  import OverflowMenu from './OverflowMenu.svelte'
  import { onMount } from 'svelte'

  let {
    editor,
    activeFormats,
    canUndo,
    canRedo,
  }: {
    editor: Editor | null
    activeFormats: ActiveFormats
    canUndo: boolean
    canRedo: boolean
  } = $props()

  let toolbarEl: HTMLElement
  let toolbarWidth = $state(0)
  let showOverflow = $derived(toolbarWidth < 600)

  onMount(() => {
    if (toolbarEl) {
      initRovingTabindex(toolbarEl, '.toolbar-btn')

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            toolbarWidth = entry.contentRect.width
          }
        })
        observer.observe(toolbarEl)

        return () => observer.disconnect()
      }
    }
  })

  function handleKeydown(event: KeyboardEvent) {
    if (toolbarEl) {
      handleRovingTabindex(toolbarEl, event, {
        selector: '.toolbar-btn',
        orientation: 'horizontal',
      })
    }
  }
</script>

<div
  class="fixed-toolbar"
  role="toolbar"
  aria-label="書式ツールバー"
  aria-orientation="horizontal"
  tabindex="0"
  bind:this={toolbarEl}
  onkeydown={handleKeydown}
  data-testid="fixed-toolbar"
>
  <FormatButtonGroup {editor} {activeFormats} />
  <div class="toolbar-separator" role="separator"></div>
  <HeadingDropdown {editor} {activeFormats} />
  <div class="toolbar-separator" role="separator"></div>

  {#if !showOverflow}
    <ListButtonGroup {editor} {activeFormats} />
    <div class="toolbar-separator" role="separator"></div>
    <InsertButtonGroup {editor} {activeFormats} />
    <div class="toolbar-separator" role="separator"></div>
    <UndoRedoButtons {editor} {canUndo} {canRedo} />
  {:else}
    <OverflowMenu visible={showOverflow}>
      {#snippet children()}
        <ListButtonGroup {editor} {activeFormats} />
        <InsertButtonGroup {editor} {activeFormats} />
        <UndoRedoButtons {editor} {canUndo} {canRedo} />
      {/snippet}
    </OverflowMenu>
  {/if}
</div>
