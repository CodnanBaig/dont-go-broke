import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '@/stores';
import { 
  createFuelLowNotification, 
  createBigSpendNotification, 
  createAchievementNotification,
  createSalaryNotification,
  createBillDueNotification,
  useNotificationStore
} from '@/stores/notificationStore';
import { ExpenseCategory } from '@/types';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationHandler: React.FC = () => {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { 
    currentBalance, 
    daysRemaining, 
    fuelStatus, 
    addExpense,
    setSalary
  } = useAppStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type) {
        switch (data.type) {
          case 'fuel_empty':
          case 'fuel_critical':
          case 'fuel_low':
            // Navigate to dashboard or salary screen
            break;
          case 'bill_due':
            // Navigate to bills screen
            break;
          case 'daily_reminder':
            // Navigate to expenses screen
            break;
          case 'big_spend':
            // Navigate to expense detail
            break;
          case 'achievement':
            // Navigate to achievements screen
            break;
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Send fuel notifications when fuel status changes
  useEffect(() => {
    if (fuelStatus.level === 'empty') {
      const notification = createFuelLowNotification(daysRemaining, fuelStatus.percentage);
      addNotification(notification);
    } else if (fuelStatus.level === 'critical') {
      const notification = createFuelLowNotification(daysRemaining, fuelStatus.percentage);
      addNotification(notification);
    } else if (fuelStatus.level === 'low') {
      const notification = createFuelLowNotification(daysRemaining, fuelStatus.percentage);
      addNotification(notification);
    }
  }, [fuelStatus.level, daysRemaining, fuelStatus.percentage]);

  // Send big spend alert when a large expense is added
  useEffect(() => {
    // This would be triggered from the expense addition logic
    // For now, we'll just set up the handler
  }, [currentBalance]);

  return null; // This component doesn't render anything
};

export default NotificationHandler;