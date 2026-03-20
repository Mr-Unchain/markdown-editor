<script lang="ts">
  import '../app.css'
  import Toolbar from '../components/shell/Toolbar.svelte'
  import Sidebar from '../components/shell/Sidebar.svelte'
  import StatusBar from '../components/shell/StatusBar.svelte'
  import NotificationToast from '../components/shell/NotificationToast.svelte'
  import ConfirmDialog from '../components/shell/ConfirmDialog.svelte'
  import { layoutState, toggleSidebar } from '$lib/stores/layout.svelte'
  import { appSettings } from '$lib/stores/settings.svelte'

  let { children } = $props()

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
      event.preventDefault()
      toggleSidebar()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="app-shell"
  data-theme={appSettings.editor.theme}
  data-testid="app-shell"
>
  <Toolbar />

  <div class="main-area">
    <Sidebar />

    <main
      class="editor-area"
      class:sidebar-open={layoutState.sidebarVisible}
      data-testid="editor-area"
    >
      <div
        class="editor-container"
        style="max-width: {appSettings.editor.editorWidth}px"
      >
        {@render children()}
      </div>
    </main>
  </div>

  <StatusBar />
  <NotificationToast />
  <ConfirmDialog />
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .main-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    padding: 2rem;
    transition: margin-left var(--sidebar-animation-duration) ease;
  }

  .editor-container {
    width: 100%;
    margin: 0 auto;
  }
</style>
