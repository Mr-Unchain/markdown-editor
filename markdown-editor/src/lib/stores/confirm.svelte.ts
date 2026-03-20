export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

const defaultState: ConfirmState = {
  visible: false,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: 'キャンセル',
  onConfirm: null,
  onCancel: null,
}

export const confirmState: ConfirmState = $state({ ...defaultState })

export function showConfirm(options: ConfirmOptions): void {
  Object.assign(confirmState, {
    visible: true,
    title: options.title,
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'OK',
    cancelLabel: options.cancelLabel ?? 'キャンセル',
    onConfirm: options.onConfirm,
    onCancel: options.onCancel ?? null,
  })
}

export function handleConfirm(): void {
  confirmState.onConfirm?.()
  Object.assign(confirmState, defaultState)
}

export function handleCancel(): void {
  confirmState.onCancel?.()
  Object.assign(confirmState, defaultState)
}
