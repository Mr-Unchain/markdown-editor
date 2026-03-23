import type { Notification, NotificationType } from '$lib/types/notification'
import { DEFAULT_NOTIFICATION_DURATION, MAX_NOTIFICATIONS } from '$lib/types/notification'

let nextId = 0

export const notificationState = $state<{ list: Notification[] }>({ list: [] })

export function notify(type: NotificationType, message: string, duration?: number): string {
  const id = `notification-${nextId++}`
  const actualDuration = duration ?? DEFAULT_NOTIFICATION_DURATION[type]

  const notification: Notification = { id, type, message, duration: actualDuration }

  notificationState.list.push(notification)

  // Keep only the most recent MAX_NOTIFICATIONS
  if (notificationState.list.length > MAX_NOTIFICATIONS) {
    notificationState.list.splice(0, notificationState.list.length - MAX_NOTIFICATIONS)
  }

  // Auto-dismiss (duration=0 means manual dismissal only)
  if (actualDuration > 0) {
    setTimeout(() => {
      dismissNotification(id)
    }, actualDuration)
  }

  return id
}

export function dismissNotification(id: string): void {
  const index = notificationState.list.findIndex((n) => n.id === id)
  if (index !== -1) {
    notificationState.list.splice(index, 1)
  }
}

export function clearAllNotifications(): void {
  notificationState.list.length = 0
}
