export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration: number
}

export const DEFAULT_NOTIFICATION_DURATION: Record<NotificationType, number> = {
  info: 3000,
  success: 3000,
  warning: 5000,
  error: 0, // NFR-U4-21: error notifications require manual dismissal
}

export const MAX_NOTIFICATIONS = 3
