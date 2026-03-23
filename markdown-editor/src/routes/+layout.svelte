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

  let { children, data } = $props()

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

  async function handleOpenWorkspace() {
    const ctx = getAppContext()
    if (!ctx) return
    const path = await ctx.fs.openFolderDialog()
    if (!path) return
    await ctx.workspaceService.openWorkspace(path)
  }

  async function handleSelectFile(node: import('$lib/types/workspace').FileTreeNode) {
    const ctx = getAppContext()
    if (!ctx || node.isDirectory) return
    await ctx.workspaceService.fileManager.openTab(node.path)
  }

  async function handleToggleFolder(node: import('$lib/types/workspace').FileTreeNode) {
    const ctx = getAppContext()
    if (!ctx || !node.isDirectory) return
    if (node.isExpanded) {
      ctx.workspaceService.fileManager.collapseFolder(node.path)
    } else {
      await ctx.workspaceService.fileManager.expandFolder(node.path)
    }
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

{#if data.error}
<div class="init-error">
  <h1>初期化エラー</h1>
  <p>{data.error}</p>
  <button onclick={() => location.reload()}>再読み込み</button>
</div>
{:else}
<div
  class="app-shell"
  data-theme={appSettings.editor.theme}
  data-testid="app-shell"
>
  <Toolbar />

  <div class="main-area">
    <Sidebar
      onOpenWorkspace={handleOpenWorkspace}
      onSelectFile={handleSelectFile}
      onToggleFolder={handleToggleFolder}
    />

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
{/if}

<style>
  .init-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #333;
    text-align: center;
    padding: 2rem;
  }

  .init-error h1 {
    font-size: 1.5rem;
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  .init-error p {
    color: #666;
    max-width: 600px;
    word-break: break-word;
    margin-bottom: 1.5rem;
  }

  .init-error button {
    padding: 0.5rem 1.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

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
