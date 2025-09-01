import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAppStore } from '@/stores';
import { NotificationType, NotificationPriority, AppNotification } from '@/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }
  
  // Schedule a notification
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }
  
  // Send an immediate notification
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
      return id;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }
  
  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }
  
  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
  
  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
  
  // Create app notification based on type
  createAppNotification(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    actionData?: Record<string, any>
  ): AppNotification {
    return {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      type,
      title,
      message,
      priority,
      isRead: false,
      createdAt: new Date(),
      actionData,
    };
  }
  
  // Generate fuel level notifications
  async generateFuelNotifications(): Promise<void> {
    const { fuelStatus, currentBalance } = useAppStore.getState();
    
    // Fuel empty notification
    if (fuelStatus.level === 'empty') {
      await this.sendImmediateNotification(
        '🚨 Fuel Tank Empty!',
        'Your balance is critically low. Time to refuel!',
        { type: 'fuel_empty' }
      );
      return;
    }
    
    // Critical fuel notification
    if (fuelStatus.level === 'critical') {
      await this.sendImmediateNotification(
        '⚠️ Critical Fuel Level!',
        'Only a few days of fuel left. Plan your expenses carefully.',
        { type: 'fuel_critical' }
      );
      return;
    }
    
    // Low fuel notification
    if (fuelStatus.level === 'low') {
      await this.sendImmediateNotification(
        '🔥 Low Fuel Warning!',
        'Your fuel is running low. Consider reducing expenses.',
        { type: 'fuel_low' }
      );
      return;
    }
    
    // High fuel notification (when refueled)
    if (fuelStatus.level === 'full' || fuelStatus.level === 'high') {
      await this.sendImmediateNotification(
        '💚 Fuel Tank Refueled!',
        'Great job! Your fuel tank is now full.',
        { type: 'fuel_full' }
      );
    }
  }
  
  // Generate spending alerts
  async generateSpendingAlerts(): Promise<void> {
    const { expenses, averageDailySpend } = useAppStore.getState();
    const today = new Date();
    
    // Get today's expenses
    const todaysExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === today.toDateString();
    });
    
    const todaysTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Alert if today's spending exceeds 2x average daily spend
    if (averageDailySpend > 0 && todaysTotal > averageDailySpend * 2) {
      await this.sendImmediateNotification(
        '💸 High Spending Day!',
        `You've spent ₹${todaysTotal} today, which is 2x your average daily spend.`,
        { type: 'high_spending', amount: todaysTotal }
      );
    }
    
    // Alert if no expenses logged today (encouragement)
    if (todaysExpenses.length === 0) {
      await this.sendImmediateNotification(
        '📅 Log Your Expenses',
        "Don't forget to log your expenses today to keep track of your spending.",
        { type: 'expense_reminder' }
      );
    }
  }
  
  // Generate weekly spending summary
  async generateWeeklySummary(): Promise<void> {
    const { expenses, salary } = useAppStore.getState();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get this week's expenses
    const weeklyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= weekAgo && expenseDate <= today;
    });
    
    const weeklyTotal = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    if (weeklyTotal > 0) {
      const percentageOfSalary = salary ? (weeklyTotal / (salary.amount / 4)) * 100 : 0;
      
      await this.sendImmediateNotification(
        '📊 Weekly Spending Summary',
        `You spent ₹${weeklyTotal} this week${salary ? ` (${percentageOfSalary.toFixed(1)}% of your weekly salary)` : ''}.`,
        { type: 'weekly_summary', amount: weeklyTotal }
      );
    }
  }
  
  // Generate monthly spending summary
  async generateMonthlySummary(): Promise<void> {
    const { expenses, salary } = useAppStore.getState();
    const today = new Date();
    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get this month's expenses
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthAgo && expenseDate <= today;
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    if (monthlyTotal > 0 && salary) {
      const percentageOfSalary = (monthlyTotal / salary.amount) * 100;
      
      let message = `You spent ₹${monthlyTotal} this month (${percentageOfSalary.toFixed(1)}% of your salary).`;
      
      if (percentageOfSalary > 100) {
        message += ' You\'ve exceeded your monthly salary!';
      } else if (percentageOfSalary > 80) {
        message += ' You\'re approaching your monthly limit.';
      } else if (percentageOfSalary < 50) {
        message += ' Great job keeping your expenses low!';
      }
      
      await this.sendImmediateNotification(
        '📅 Monthly Spending Summary',
        message,
        { type: 'monthly_summary', amount: monthlyTotal, percentage: percentageOfSalary }
      );
    }
  }
  
  // Generate category spending alerts
  async generateCategoryAlerts(): Promise<void> {
    const { expenses } = useAppStore.getState();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get this week's expenses by category
    const weeklyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= weekAgo && expenseDate <= today;
    });
    
    // Group by category
    const categoryTotals: Record<string, number> = {};
    weeklyExpenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
    // Find highest spending category
    let highestCategory = '';
    let highestAmount = 0;
    
    for (const [category, amount] of Object.entries(categoryTotals)) {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    }
    
    if (highestCategory && highestAmount > 0) {
      await this.sendImmediateNotification(
        '🏷️ Top Spending Category',
        `You spent the most on ${highestCategory}: ₹${highestAmount} this week.`,
        { type: 'category_alert', category: highestCategory, amount: highestAmount }
      );
    }
  }
  
  // Generate bill due notifications
  async generateBillDueNotifications(): Promise<void> {
    const { recurringBills } = useAppStore.getState();
    const today = new Date();
    
    for (const bill of recurringBills) {
      if (!bill.isActive) continue;
      
      const dueDate = new Date(bill.nextDueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Send notification 1 day before due date
      if (diffDays === 1) {
        await this.sendImmediateNotification(
          '📅 Bill Due Tomorrow',
          `Your ${bill.name} bill of ${bill.amount} is due tomorrow.`,
          { type: 'bill_due', billId: bill.id }
        );
      }
      
      // Send notification on due date
      if (diffDays === 0) {
        await this.sendImmediateNotification(
          '📅 Bill Due Today',
          `Your ${bill.name} bill of ${bill.amount} is due today.`,
          { type: 'bill_due', billId: bill.id }
          );
      }
    }
  }
  
  // Generate daily reminder notification
  async scheduleDailyReminder(): Promise<void> {
    // Schedule for 9:00 AM daily
    await this.scheduleNotification(
      '💰 Daily Finance Check',
      'Time to review your spending and update your expenses.',
      {
        hour: 9,
        minute: 0,
        repeats: true,
      },
      { type: 'daily_reminder' }
    );
  }
  
  // Generate big spend alert
  async generateBigSpendAlert(amount: number, description: string): Promise<void> {
    const { currentBalance } = useAppStore.getState();
    
    // Alert if expense is more than 10% of current balance
    if (amount > currentBalance * 0.1) {
      await this.sendImmediateNotification(
        '💸 Big Expense Alert',
        `You just spent ₹${amount} on ${description}. This is a significant expense.`,
        { type: 'big_spend', amount, description }
      );
    }
  }
}

export default NotificationService.getInstance();