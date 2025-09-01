// Expense categories with icons and colors
export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport', 
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  UTILITIES = 'Utilities',
  HEALTHCARE = 'Healthcare',
  EDUCATION = 'Education',
  RENT = 'Rent',
  EMI = 'EMI',
  SUBSCRIPTION = 'Subscription',
  INVESTMENT = 'Investment',
  SAVINGS = 'Savings',
  OTHERS = 'Others'
}

// Category metadata for UI display
export interface CategoryMetadata {
  icon: string;
  color: string;
  description: string;
}

export const CATEGORY_METADATA: Record<ExpenseCategory, CategoryMetadata> = {
  [ExpenseCategory.FOOD]: {
    icon: 'restaurant',
    color: '#ef4444',
    description: 'Food, groceries, dining'
  },
  [ExpenseCategory.TRANSPORT]: {
    icon: 'car',
    color: '#3b82f6',
    description: 'Fuel, public transport, rides'
  },
  [ExpenseCategory.ENTERTAINMENT]: {
    icon: 'videocam',
    color: '#8b5cf6',
    description: 'Movies, games, fun activities'
  },
  [ExpenseCategory.SHOPPING]: {
    icon: 'bag',
    color: '#ec4899',
    description: 'Clothes, accessories, shopping'
  },
  [ExpenseCategory.UTILITIES]: {
    icon: 'flash',
    color: '#f59e0b',
    description: 'Electricity, water, internet'
  },
  [ExpenseCategory.HEALTHCARE]: {
    icon: 'medical',
    color: '#10b981',
    description: 'Doctor, medicines, insurance'
  },
  [ExpenseCategory.EDUCATION]: {
    icon: 'school',
    color: '#06b6d4',
    description: 'Books, courses, learning'
  },
  [ExpenseCategory.RENT]: {
    icon: 'home',
    color: '#84cc16',
    description: 'House rent, maintenance'
  },
  [ExpenseCategory.EMI]: {
    icon: 'card',
    color: '#f97316',
    description: 'Loan payments, EMIs'
  },
  [ExpenseCategory.SUBSCRIPTION]: {
    icon: 'refresh',
    color: '#6366f1',
    description: 'Netflix, Spotify, apps'
  },
  [ExpenseCategory.INVESTMENT]: {
    icon: 'trending-up',
    color: '#22c55e',
    description: 'Stocks, mutual funds, FDs'
  },
  [ExpenseCategory.SAVINGS]: {
    icon: 'wallet',
    color: '#14b8a6',
    description: 'Savings account, piggy bank'
  },
  [ExpenseCategory.OTHERS]: {
    icon: 'ellipsis-horizontal',
    color: '#6b7280',
    description: 'Miscellaneous expenses'
  }
};

// Notification system types
export enum NotificationType {
  FUEL_LOW = 'fuel_low',
  FUEL_EMPTY = 'fuel_empty',
  BIG_SPEND = 'big_spend',
  ACHIEVEMENT = 'achievement',
  SALARY_RECEIVED = 'salary_received',
  BILL_DUE = 'bill_due',
  SUGGESTION = 'suggestion',
  DAILY_REMINDER = 'daily_reminder'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  actionData?: Record<string, any>;
}

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionData?: Record<string, any>;
}

export interface NotificationSettings {
  fuelAlerts: boolean;
  bigSpendAlerts: boolean;
  achievementAlerts: boolean;
  billReminders: boolean;
  dailyReminders: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Fuel level status for gamification
export enum FuelLevel {
  FULL = 'full',      // > 75%
  HIGH = 'high',      // 50% - 75%
  MEDIUM = 'medium',  // 25% - 50%
  LOW = 'low',        // 10% - 25%
  CRITICAL = 'critical', // 5% - 10%
  EMPTY = 'empty'     // < 5%
}

export interface FuelStatus {
  level: FuelLevel;
  percentage: number;
  daysRemaining: number;
  color: string;
  warningMessage?: string;
}