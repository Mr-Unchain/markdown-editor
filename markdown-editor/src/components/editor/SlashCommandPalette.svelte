<script lang="ts">
  import type { SlashCommandItem } from '$lib/types/slash-command'

  let {
    items,
    selectedIndex = 0,
    onSelect,
  }: {
    items: SlashCommandItem[]
    selectedIndex: number
    onSelect: (item: SlashCommandItem) => void
  } = $props()

  // グループ別にアイテムを分類
  let groupedItems = $derived(() => {
    const groups = new Map<string, SlashCommandItem[]>()
    for (const item of items) {
      const group = groups.get(item.group) ?? []
      group.push(item)
      groups.set(item.group, group)
    }
    return groups
  })

  let flatIndex = 0
</script>

<div
  class="slash-command-palette"
  role="listbox"
  aria-label="コマンドパレット"
  data-testid="slash-command-list"
>
  {#if items.length === 0}
    <div class="slash-command-empty">コマンドが見つかりません</div>
  {:else}
    {@const groups = groupedItems()}
    {#each [...groups.entries()] as [groupName, groupItems]}
      <div class="slash-command-group">
        <div class="slash-command-group-name">{groupName}</div>
        {#each groupItems as item, i}
          {@const currentFlatIndex = items.indexOf(item)}
          <button
            class="slash-command-item"
            class:selected={currentFlatIndex === selectedIndex}
            role="option"
            aria-selected={currentFlatIndex === selectedIndex}
            onclick={() => onSelect(item)}
            data-testid="slash-command-{item.id}"
          >
            <span class="slash-command-icon">{item.icon}</span>
            <div class="slash-command-text">
              <span class="slash-command-title">{item.title}</span>
              <span class="slash-command-description">{item.description}</span>
            </div>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>
