import { create } from 'zustand'

export interface AppNotification {
  id: string
  type: string
  title: string
  body?: string | null
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  setNotifications: (notifications: AppNotification[]) => void
  addNotification: (notification: AppNotification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length }),

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length })
  },

  markAsRead: (id) => {
    const notifications = get().notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    )
    set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length })
  },

  markAllAsRead: () => {
    const notifications = get().notifications.map(n => ({ ...n, is_read: true }))
    set({ notifications, unreadCount: 0 })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
