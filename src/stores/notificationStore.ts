import { create } from 'zustand';
import { persist, notificationStorePersistConfig } from './persistence';
import { 
  AppNotification, 
  NotificationInput, 
  NotificationSettings, 
  NotificationType, 
  NotificationPriority 
} from '@/types';
import NotificationService from '@/services/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  settings: NotificationSettings;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  // Notification Management
  addNotification: (notification: NotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Settings Management
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Utility Functions
  getUnreadNotifications: () => AppNotification[];
  getNotificationsByType: (type: NotificationType) => AppNotification[];
  getHighPriorityNotifications: () => AppNotification[];
  
  // System Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Notification Service Integration
  requestNotificationPermissions: () => Promise<boolean>;
  sendFuelNotifications: () => Promise<void>;
  sendBillDueNotifications: () => Promise<void>;
  scheduleDailyReminder: () => Promise<void>;
  sendBigSpendAlert: (amount: number, description: string) => Promise<void>;
}

type NotificationStore = NotificationState & NotificationActions;

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Default notification settings
const defaultSettings: NotificationSettings = {
  fuelAlerts: true,
  bigSpendAlerts: true,
  achievementAlerts: true,
  billReminders: true,
  dailyReminders: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  },
  soundEnabled: true,
  vibrationEnabled: true
};

const initialState: NotificationState = {
  notifications: [],
  settings: defaultSettings,
  unreadCount: 0,
  isLoading: false,
  error: null
};

export const useNotificationStore = create<NotificationStore>()(persist((set, get) => ({
  ...initialState,
  
  // Notification Management
  addNotification: (notificationInput: NotificationInput) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      
      // Check if notifications are enabled for this type
      const isTypeEnabled = (() => {
        switch (notificationInput.type) {
          case NotificationType.FUEL_LOW:
          case NotificationType.FUEL_EMPTY:
            return state.settings.fuelAlerts;
          case NotificationType.BIG_SPEND:
            return state.settings.bigSpendAlerts;
          case NotificationType.ACHIEVEMENT:
            return state.settings.achievementAlerts;
          case NotificationType.BILL_DUE:
            return state.settings.billReminders;
          case NotificationType.DAILY_REMINDER:
            return state.settings.dailyReminders;
          default:
            return true;
        }
      })();
      
      if (!isTypeEnabled) {
        set({ isLoading: false });
        return;
      }
      
      // Check quiet hours
      if (state.settings.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const { startTime, endTime } = state.settings.quietHours;
        
        const isInQuietHours = (() => {
          if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
          } else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
          }
        })();
        
        if (isInQuietHours && notificationInput.priority !== NotificationPriority.URGENT) {
          set({ isLoading: false });
          return;
        }
      }
      
      const notification: AppNotification = {
        id: generateId(),
        type: notificationInput.type,
        title: notificationInput.title,
        message: notificationInput.message,
        priority: notificationInput.priority || NotificationPriority.NORMAL,
        isRead: false,
        createdAt: new Date(),
        actionData: notificationInput.actionData
      };
      
      set(state => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        isLoading: false
      }));
      
      // Send actual notification through NotificationService
      NotificationService.sendImmediateNotification(
        notification.title,
        notification.message,
        { type: notification.type, ...notification.actionData }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add notification';
      set({ error: errorMessage, isLoading: false });
      console.error('Add notification error:', error);
    }
  },
  
  markAsRead: (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        if (!notification || notification.isRead) {
          set({ isLoading: false });
          return state;
        }
        
        const newState = {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
          isLoading: false
        };
        
        return newState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      set({ error: errorMessage, isLoading: false });
      console.error('Mark as read error:', error);
    }
  },
  
  markAllAsRead: () => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      set({ error: errorMessage, isLoading: false });
      console.error('Mark all as read error:', error);
    }
  },
  
  deleteNotification: (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.isRead;
        
        const newState = {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          isLoading: false
        };
        
        return newState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete notification error:', error);
    }
  },
  
  clearAllNotifications: () => {
    set({ isLoading: true, error: null });
    try {
      set({
        notifications: [],
        unreadCount: 0,
        isLoading: false
      });
      // Cancel all scheduled notifications
      NotificationService.cancelAllNotifications();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear notifications';
      set({ error: errorMessage, isLoading: false });
      console.error('Clear notifications error:', error);
    }
  },
  
  // Settings Management
  updateSettings: (newSettings: Partial<NotificationSettings>) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        settings: { ...state.settings, ...newSettings },
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      set({ error: errorMessage, isLoading: false });
      console.error('Update settings error:', error);
    }
  },
  
  // Utility Functions
  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.isRead);
  },
  
  getNotificationsByType: (type: NotificationType) => {
    return get().notifications.filter(n => n.type === type);
  },
  
  getHighPriorityNotifications: () => {
    return get().notifications.filter(n => 
      n.priority === NotificationPriority.HIGH || 
      n.priority === NotificationPriority.URGENT
    );
  },
  
  // System Actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Notification Service Integration
  requestNotificationPermissions: async (): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const result = await NotificationService.requestPermissions();
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request notification permissions';
      set({ error: errorMessage, isLoading: false });
      console.error('Request permissions error:', error);
      return false;
    }
  },
  
  sendFuelNotifications: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await NotificationService.generateFuelNotifications();
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send fuel notifications';
      set({ error: errorMessage, isLoading: false });
      console.error('Send fuel notifications error:', error);
    }
  },
  
  sendBillDueNotifications: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await NotificationService.generateBillDueNotifications();
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send bill due notifications';
      set({ error: errorMessage, isLoading: false });
      console.error('Send bill due notifications error:', error);
    }
  },
  
  scheduleDailyReminder: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await NotificationService.scheduleDailyReminder();
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule daily reminder';
      set({ error: errorMessage, isLoading: false });
      console.error('Schedule daily reminder error:', error);
    }
  },
  
  sendBigSpendAlert: async (amount: number, description: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await NotificationService.generateBigSpendAlert(amount, description);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send big spend alert';
      set({ error: errorMessage, isLoading: false });
      console.error('Send big spend alert error:', error);
    }
  }
}), notificationStorePersistConfig));

// Helper functions for creating common notifications
export const createFuelLowNotification = (daysLeft: number, percentage: number): NotificationInput => ({
  type: NotificationType.FUEL_LOW,
  title: '⚠️ Low Fuel Warning!',
  message: `Only ${daysLeft} days of fuel remaining (${percentage}%)`,
  priority: NotificationPriority.HIGH,
  actionData: { daysLeft, percentage }
});

export const createBigSpendNotification = (amount: number, category: string, previousDays: number, newDays: number): NotificationInput => ({
  type: NotificationType.BIG_SPEND,
  title: '🚨 Big Spend Alert!',
  message: `₹${amount} spent on ${category}. Days reduced from ${previousDays} → ${newDays}`,
  priority: NotificationPriority.HIGH,
  actionData: { amount, category, previousDays, newDays }
});

export const createAchievementNotification = (title: string, description: string): NotificationInput => ({
  type: NotificationType.ACHIEVEMENT,
  title: '🏆 Achievement Unlocked!',
  message: `${title} - ${description}`,
  priority: NotificationPriority.NORMAL,
  actionData: { title, description }
});

export const createSalaryNotification = (amount: number): NotificationInput => ({
  type: NotificationType.SALARY_RECEIVED,
  title: '💰 Salary Received!',
  message: `Wallet recharged with ₹${amount}!`,
  priority: NotificationPriority.NORMAL,
  actionData: { amount }
});

export const createBillDueNotification = (billName: string, amount: number, dueDate: Date): NotificationInput => ({
  type: NotificationType.BILL_DUE,
  title: '📅 Bill Due Reminder',
  message: `${billName} (₹${amount}) is due on ${dueDate.toLocaleDateString()}`,
  priority: NotificationPriority.NORMAL,
  actionData: { billName, amount, dueDate: dueDate.toISOString() }
});