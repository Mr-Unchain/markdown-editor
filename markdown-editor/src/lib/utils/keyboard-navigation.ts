/**
 * Roving Tabindex ヘルパー（A-U2-02）
 * ツールバー内のキーボードナビゲーションを管理する
 */

export interface RovingTabindexOptions {
  /** ナビゲーション対象の要素セレクタ */
  selector: string
  /** ループするか（末尾→先頭） */
  loop?: boolean
  /** 方向 */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * コンテナ内のフォーカス可能要素間をキーボードで移動する
 */
export function handleRovingTabindex(
  container: HTMLElement,
  event: KeyboardEvent,
  options: RovingTabindexOptions,
): void {
  const { selector, loop = true, orientation = 'horizontal' } = options
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
  if (items.length === 0) return

  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'

  if (event.key !== prevKey && event.key !== nextKey) return

  event.preventDefault()

  const currentIndex = items.findIndex((el) => el === document.activeElement)
  let nextIndex: number

  if (event.key === nextKey) {
    nextIndex = currentIndex + 1
    if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1
    }
  } else {
    nextIndex = currentIndex - 1
    if (nextIndex < 0) {
      nextIndex = loop ? items.length - 1 : 0
    }
  }

  // tabindex の更新
  for (const item of items) {
    item.setAttribute('tabindex', '-1')
  }
  items[nextIndex].setAttribute('tabindex', '0')
  items[nextIndex].focus()
}

/**
 * コンテナ内のフォーカス可能要素を初期化する
 * 最初の要素のみ tabindex="0"、残りは tabindex="-1"
 */
export function initRovingTabindex(container: HTMLElement, selector: string): void {
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
  items.forEach((item, index) => {
    item.setAttribute('tabindex', index === 0 ? '0' : '-1')
  })
}
