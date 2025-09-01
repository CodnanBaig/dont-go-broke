import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationType, NotificationPriority } from '@/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useNotificationStore.getState().clearAllNotifications();
  });

  it('should initialize with default state', () => {
    const state = useNotificationStore.getState();
    
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.settings.fuelAlerts).toBe(true);
    expect(state.settings.bigSpendAlerts).toBe(true);
  });

  it('should add notification and update unread count', () => {
    const notification = {
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel is running low',
      priority: NotificationPriority.HIGH,
    };
    
    useNotificationStore.getState().addNotification(notification);
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe('Low Fuel');
  });

  it('should mark notification as read and update unread count', () => {
    // Add a notification
    const notification = {
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel is running low',
      priority: NotificationPriority.HIGH,
    };
    
    useNotificationStore.getState().addNotification(notification);
    
    // Get the notification ID
    const state = useNotificationStore.getState();
    const notificationId = state.notifications[0].id;
    
    // Mark as read
    useNotificationStore.getState().markAsRead(notificationId);
    
    // Check that unread count is updated
    const newState = useNotificationStore.getState();
    expect(newState.unreadCount).toBe(0);
    expect(newState.notifications[0].isRead).toBe(true);
  });

  it('should delete notification', () => {
    // Add a notification
    const notification = {
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel is running low',
      priority: NotificationPriority.HIGH,
    };
    
    useNotificationStore.getState().addNotification(notification);
    
    // Get the notification ID
    const state = useNotificationStore.getState();
    const notificationId = state.notifications[0].id;
    
    // Delete the notification
    useNotificationStore.getState().deleteNotification(notificationId);
    
    // Check that notification is removed
    const newState = useNotificationStore.getState();
    expect(newState.notifications).toHaveLength(0);
    expect(newState.unreadCount).toBe(0);
  });

  it('should update settings', () => {
    const newSettings = {
      fuelAlerts: false,
      bigSpendAlerts: false,
    };
    
    useNotificationStore.getState().updateSettings(newSettings);
    
    const state = useNotificationStore.getState();
    expect(state.settings.fuelAlerts).toBe(false);
    expect(state.settings.bigSpendAlerts).toBe(false);
  });

  it('should filter notifications by type', () => {
    // Add different types of notifications
    useNotificationStore.getState().addNotification({
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel is running low',
      priority: NotificationPriority.HIGH,
    });
    
    useNotificationStore.getState().addNotification({
      type: NotificationType.BIG_SPEND,
      title: 'Big Spend',
      message: 'You spent a lot',
      priority: NotificationPriority.HIGH,
    });
    
    // Filter by fuel low type
    const fuelNotifications = useNotificationStore.getState().getNotificationsByType(NotificationType.FUEL_LOW);
    expect(fuelNotifications).toHaveLength(1);
    expect(fuelNotifications[0].type).toBe(NotificationType.FUEL_LOW);
  });

  it('should get high priority notifications', () => {
    // Add notifications with different priorities
    useNotificationStore.getState().addNotification({
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel is running low',
      priority: NotificationPriority.HIGH,
    });
    
    useNotificationStore.getState().addNotification({
      type: NotificationType.DAILY_REMINDER,
      title: 'Daily Reminder',
      message: 'Check your expenses',
      priority: NotificationPriority.LOW,
    });
    
    // Get high priority notifications
    const highPriorityNotifications = useNotificationStore.getState().getHighPriorityNotifications();
    expect(highPriorityNotifications).toHaveLength(1);
    expect(highPriorityNotifications[0].priority).toBe(NotificationPriority.HIGH);
  });
});