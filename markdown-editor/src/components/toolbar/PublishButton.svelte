<script lang="ts">
  import { getIsOnline } from '$lib/utils/network-status.svelte'
  import { hasCredentials } from '$lib/stores/platform-store.svelte'
  import { isPublishing } from '$lib/stores/publish-store.svelte'

  let { onclick, platformId = 'zenn' }: {
    onclick: () => void
    platformId: string
  } = $props()

  let canPublish = $derived(getIsOnline() && hasCredentials(platformId) && !isPublishing())
</script>

<button
  {onclick}
  disabled={!canPublish}
  title={!getIsOnline() ? 'オフラインです' : !hasCredentials(platformId) ? '認証情報が未設定です' : ''}
  data-testid="publish-button"
>
  投稿
</button>
