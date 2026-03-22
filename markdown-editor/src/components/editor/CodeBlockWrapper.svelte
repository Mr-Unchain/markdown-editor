<script lang="ts">
  import { SUPPORTED_LANGUAGES } from '$lib/types/code-block'

  import type { Snippet } from 'svelte'

  let {
    language = 'plaintext',
    onLanguageChange,
    onCopy,
    children,
  }: {
    language: string
    onLanguageChange: (lang: string) => void
    onCopy: () => void
    children?: Snippet
  } = $props()

  let copied = $state(false)

  async function handleCopy() {
    onCopy()
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="code-block-wrapper" data-testid="code-block-wrapper">
  <div class="code-block-header">
    <select
      class="code-block-language"
      value={language}
      onchange={(e) => onLanguageChange((e.target as HTMLSelectElement).value)}
      role="combobox"
      aria-label="プログラミング言語"
      data-testid="code-block-language-select"
    >
      {#each SUPPORTED_LANGUAGES as lang}
        <option value={lang.id}>{lang.label}</option>
      {/each}
    </select>
    <button
      class="code-block-copy"
      onclick={handleCopy}
      aria-label={copied ? 'コピーしました' : 'コードをコピー'}
      data-testid="code-block-copy"
    >
      {copied ? '✓' : '📋'}
    </button>
  </div>
  <div class="code-block-content">
    {@render children?.()}
  </div>
</div>
