<script lang="ts">
  import '../app.css'
  import Toolbar from '../components/shell/Toolbar.svelte'
  import Sidebar from '../components/shell/Sidebar.svelte'
  import StatusBar from '../components/shell/StatusBar.svelte'
  import NotificationToast from '../components/shell/NotificationToast.svelte'
  import ConfirmDialog from '../components/shell/ConfirmDialog.svelte'
  import TabBar from '../components/tabs/TabBar.svelte'
  import WelcomeView from '../components/editor/WelcomeView.svelte'
  import PlainTextEditor from '../components/editor/PlainTextEditor.svelte'
  import { layoutState, toggleSidebar } from '$lib/stores/layout.svelte'
  import { appSettings } from '$lib/stores/settings.svelte'
  import { workspaceState } from '$lib/stores/workspace.svelte'
  import { tabsState, getActiveTab } from '$lib/stores/tabs.svelte'
  import { getAppContext } from '$lib/app-init'

  let { children } = $props()

  function handleKeydown(event: KeyboardEvent) {
    // Ctrl+\ — サイドバー切替
    if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
      event.preventDefault()
      toggleSidebar()
    }

    // Ctrl+S — ファイル保存
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      handleSave()
    }

    // Ctrl+W — タブを閉じる
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
      event.preventDefault()
      handleCloseActiveTab()
    }
  }

  function handleSave() {
    const ctx = getAppContext()
    if (!ctx) return
    const activeTab = getActiveTab()
    if (!activeTab) return
    if (activeTab.content === null) return
    ctx.workspaceService.fileManager.saveFile(activeTab.filePath, activeTab.content)
  }

  function handleCloseActiveTab() {
    const ctx = getAppContext()
    if (!ctx) return
    const activeTab = getActiveTab()
    if (!activeTab) return
    ctx.workspaceService.fileManager.closeTab(activeTab.filePath)
  }

  function handleTabActivate(tab: import('$lib/types/workspace').Tab) {
    const ctx = getAppContext()
    if (!ctx) return
    ctx.workspaceService.fileManager.switchTab(tab.filePath)
  }

  function handleTabClose(tab: import('$lib/types/workspace').Tab) {
    const ctx = getAppContext()
    if (!ctx) return
    ctx.workspaceService.fileManager.closeTab(tab.filePath)
  }

  function handleTabReorder(fromIndex: number, toIndex: number) {
    const ctx = getAppContext()
    if (!ctx) return
    ctx.workspaceService.fileManager.reorderTabs(fromIndex, toIndex)
  }

  function handleOpenWorkspace() {
    // Tauri dialog APIで実装（将来のU4で完全統合）
  }

  function handlePlainTextUpdate(content: string) {
    const ctx = getAppContext()
    if (!ctx) return
    const activeTab = getActiveTab()
    if (!activeTab) return
    ctx.workspaceService.fileManager.markDirty(activeTab.filePath)
    const tab = tabsState.tabs.find((t: import('$lib/types/workspace').Tab) => t.filePath === activeTab.filePath)
    if (tab) tab.content = content
  }

  // 表示状態の判定
  let activeTab = $derived(getActiveTab())
  let hasWorkspace = $derived(workspaceState.current !== null)
  let hasTabs = $derived(tabsState.tabs.length > 0)
  let showWelcome = $derived(!hasTabs)
  let showMarkdownEditor = $derived(activeTab !== null && activeTab.fileType === 'markdown')
  let showPlainTextEditor = $derived(activeTab !== null && activeTab.fileType === 'plaintext')
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
      <TabBar
        tabs={tabsState.tabs}
        onActivate={handleTabActivate}
        onClose={handleTabClose}
        onReorder={handleTabReorder}
      />

      <div
        class="editor-container"
        style="max-width: {appSettings.editor.editorWidth}px"
      >
        {#if showWelcome}
          <WelcomeView onOpenWorkspace={handleOpenWorkspace} />
        {:else if showMarkdownEditor}
          {@render children()}
        {:else if showPlainTextEditor && activeTab}
          <PlainTextEditor
            content={activeTab.content}
            onUpdate={handlePlainTextUpdate}
          />
        {:else}
          {@render children()}
        {/if}
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
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: margin-left var(--sidebar-animation-duration) ease;
  }

  .editor-container {
    flex: 1;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    overflow-y: auto;
    padding: 2rem;
  }
</style>
