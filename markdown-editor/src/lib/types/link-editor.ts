/** リンクポップオーバーの状態 */
export interface LinkEditorState {
  /** 表示中か */
  isOpen: boolean
  /** 編集中のURL */
  url: string
  /** 表示テキスト */
  text: string
  /** 新規タブで開くか */
  openInNewTab: boolean
  /** 編集モードか（既存リンクの編集） vs 新規作成 */
  mode: 'create' | 'edit'
}
