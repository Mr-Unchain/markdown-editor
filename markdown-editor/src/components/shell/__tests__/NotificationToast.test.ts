import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { notify, clearAllNotifications } from '$lib/stores/notifications.svelte'
import NotificationToast from '../NotificationToast.svelte'

describe('NotificationToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllNotifications()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders no toasts when empty', () => {
    render(NotificationToast)
    expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument()
  })

  it('renders notification when added', async () => {
    render(NotificationToast)
    notify('info', 'テスト通知')
    await tick()
    const toasts = screen.getAllByTestId('notification-toast')
    expect(toasts).toHaveLength(1)
  })

  it('shows notification message', async () => {
    render(NotificationToast)
    notify('error', 'エラーが発生しました')
    await tick()
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  it('removes notification after timeout', async () => {
    render(NotificationToast)
    notify('info', '消えるメッセージ', 1000)
    await tick()
    expect(screen.getAllByTestId('notification-toast')).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    await tick()
    expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument()
  })

  it('shows max 3 notifications', async () => {
    render(NotificationToast)
    notify('info', 'One')
    notify('info', 'Two')
    notify('info', 'Three')
    notify('info', 'Four')
    await tick()
    const toasts = screen.getAllByTestId('notification-toast')
    expect(toasts).toHaveLength(3)
  })
})
