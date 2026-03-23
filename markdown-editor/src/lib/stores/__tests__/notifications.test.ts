import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { notificationState, notify, dismissNotification, clearAllNotifications } from '../notifications.svelte'

describe('notifications store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllNotifications()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts empty', () => {
    expect(notificationState.list).toEqual([])
  })

  it('notify adds a notification', () => {
    notify('info', 'Test message')
    expect(notificationState.list).toHaveLength(1)
    expect(notificationState.list[0]!.type).toBe('info')
    expect(notificationState.list[0]!.message).toBe('Test message')
  })

  it('notify returns notification id', () => {
    const id = notify('info', 'Test')
    expect(id).toMatch(/^notification-\d+$/)
  })

  it('uses default duration for info type', () => {
    notify('info', 'Test')
    expect(notificationState.list[0]!.duration).toBe(3000)
  })

  it('uses default duration for error type (NFR-U4-21: manual dismiss)', () => {
    notify('error', 'Test')
    expect(notificationState.list[0]!.duration).toBe(0)
  })

  it('allows custom duration', () => {
    notify('info', 'Test', 10000)
    expect(notificationState.list[0]!.duration).toBe(10000)
  })

  it('auto-dismisses after duration', () => {
    notify('info', 'Test', 3000)
    expect(notificationState.list).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(notificationState.list).toHaveLength(0)
  })

  it('limits to MAX_NOTIFICATIONS (3)', () => {
    notify('info', 'First')
    notify('info', 'Second')
    notify('info', 'Third')
    notify('info', 'Fourth')

    expect(notificationState.list).toHaveLength(3)
    expect(notificationState.list[0]!.message).toBe('Second')
    expect(notificationState.list[2]!.message).toBe('Fourth')
  })

  it('dismissNotification removes by id', () => {
    const id = notify('info', 'To remove')
    notify('info', 'To keep')
    expect(notificationState.list).toHaveLength(2)

    dismissNotification(id)
    expect(notificationState.list).toHaveLength(1)
    expect(notificationState.list[0]!.message).toBe('To keep')
  })

  it('clearAllNotifications empties the list', () => {
    notify('info', 'One')
    notify('info', 'Two')
    clearAllNotifications()
    expect(notificationState.list).toEqual([])
  })
})
