const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export interface FocusTrap {
  activate(): void
  deactivate(): void
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
  let previousActiveElement: Element | null = null
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return {
    activate() {
      previousActiveElement = document.activeElement
      keydownHandler = handleKeydown
      container.addEventListener('keydown', keydownHandler)

      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0]!.focus()
      }
    },

    deactivate() {
      if (keydownHandler) {
        container.removeEventListener('keydown', keydownHandler)
        keydownHandler = null
      }

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus()
      }
      previousActiveElement = null
    },
  }
}
