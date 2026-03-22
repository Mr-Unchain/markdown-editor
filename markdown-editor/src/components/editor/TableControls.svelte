<script lang="ts">
  import type { Editor } from '@tiptap/core'

  let { editor }: { editor: Editor | null } = $props()

  let isInTable = $derived(editor?.isActive('table') ?? false)

  const actions = [
    { id: 'addRowBefore', label: '上に行を追加', action: () => editor?.chain().focus().addRowBefore().run() },
    { id: 'addRowAfter', label: '下に行を追加', action: () => editor?.chain().focus().addRowAfter().run() },
    { id: 'deleteRow', label: '行を削除', action: () => editor?.chain().focus().deleteRow().run() },
    { id: 'addColumnBefore', label: '左に列を追加', action: () => editor?.chain().focus().addColumnBefore().run() },
    { id: 'addColumnAfter', label: '右に列を追加', action: () => editor?.chain().focus().addColumnAfter().run() },
    { id: 'deleteColumn', label: '列を削除', action: () => editor?.chain().focus().deleteColumn().run() },
    { id: 'deleteTable', label: 'テーブルを削除', action: () => editor?.chain().focus().deleteTable().run() },
  ] as const
</script>

{#if isInTable}
  <div
    class="table-controls"
    role="menu"
    aria-label="テーブル操作"
    data-testid="table-controls"
  >
    {#each actions as act}
      <button
        class="table-control-btn"
        role="menuitem"
        onclick={act.action}
        data-testid="table-{act.id}"
      >
        {act.label}
      </button>
    {/each}
  </div>
{/if}
