import { create } from 'zustand';
import { persist, appStorePersistConfig } from './persistence';
import { 
  UserProfile, 
  SalaryData, 
  Expense, 
  ExpenseInput, 
  RecurringBill, 
  RecurringBillInput, 
  SpendingAnalytics,
  FinancialContext,
  CategorySpending,
  MonthlySpending,
  FuelStatus,
  FuelLevel
} from '@/types';
import AchievementService from '@/services/achievementService';

interface AppState {
  // User Profile
  user: UserProfile | null;
  
  // Financial Data
  salary: SalaryData | null;
  expenses: Expense[];
  recurringBills: RecurringBill[];
  
  // Calculated Values
  currentBalance: number;
  daysRemaining: number;
  averageDailySpend: number;
  fuelStatus: FuelStatus;
  
  // Loading States
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  // User Actions
  setUser: (user: UserProfile) => void;
  
  // Salary Management
  setSalary: (amount: number, frequency?: 'monthly' | 'weekly' | 'biweekly') => Promise<void>;
  
  // Expense Management
  addExpense: (expense: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Recurring Bills Management
  addRecurringBill: (bill: RecurringBillInput) => Promise<void>;
  updateRecurringBill: (id: string, bill: Partial<RecurringBill>) => Promise<void>;
  deleteRecurringBill: (id: string) => Promise<void>;
  
  // Calculations
  calculateBalance: () => number;
  calculateDaysRemaining: () => number;
  calculateAverageDailySpend: () => number;
  calculateFuelStatus: () => FuelStatus;
  getSpendingAnalytics: () => SpendingAnalytics;
  getFinancialContext: () => FinancialContext;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshData: () => Promise<void>;
  resetApp: () => void;
}

type AppStore = AppState & AppActions;

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Helper function to calculate fuel level based on percentage
const getFuelLevel = (percentage: number): FuelLevel => {
  if (percentage > 75) return FuelLevel.FULL;
  if (percentage > 50) return FuelLevel.HIGH;
  if (percentage > 25) return FuelLevel.MEDIUM;
  if (percentage > 10) return FuelLevel.LOW;
  if (percentage > 5) return FuelLevel.CRITICAL;
  return FuelLevel.EMPTY;
};

// Helper function to get fuel color based on level
const getFuelColor = (level: FuelLevel): string => {
  switch (level) {
    case FuelLevel.FULL:
    case FuelLevel.HIGH:
      return '#22c55e'; // fuel-full
    case FuelLevel.MEDIUM:
      return '#f59e0b'; // fuel-medium
    case FuelLevel.LOW:
      return '#ef4444'; // fuel-low
    case FuelLevel.CRITICAL:
    case FuelLevel.EMPTY:
      return '#991b1b'; // fuel-empty
    default:
      return '#6b7280'; // gray
  }
};

const initialState: AppState = {
  user: null,
  salary: null,
  expenses: [],
  recurringBills: [],
  currentBalance: 0,
  daysRemaining: 0,
  averageDailySpend: 0,
  fuelStatus: {
    level: FuelLevel.EMPTY,
    percentage: 0,
    daysRemaining: 0,
    color: getFuelColor(FuelLevel.EMPTY)
  },
  isLoading: false,
  error: null
};

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  ...initialState,
  
  // User Actions
  setUser: (user: UserProfile) => {
    set({ user });
  },
  
  // Salary Management
  setSalary: async (amount: number, frequency = 'monthly') => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const nextSalaryDate = new Date(now);
      
      // Calculate next salary date based on frequency
      switch (frequency) {
        case 'weekly':
          nextSalaryDate.setDate(now.getDate() + 7);
          break;
        case 'biweekly':
          nextSalaryDate.setDate(now.getDate() + 14);
          break;
        case 'monthly':
        default:
          nextSalaryDate.setMonth(now.getMonth() + 1);
          nextSalaryDate.setDate(1); // First of next month
          break;
      }
      
      const state = get();
      const recurringBillsTotal = state.recurringBills
        .filter(bill => bill.isActive && bill.autoDeduct)
        .reduce((total, bill) => total + bill.amount, 0);
      
      const newSalary: SalaryData = {
        amount,
        frequency,
        lastUpdated: now,
        nextSalaryDate,
        recurringBillsDeducted: recurringBillsTotal
      };
      
      set({ 
        salary: newSalary,
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        averageDailySpend: get().calculateAverageDailySpend(),
        fuelStatus: get().calculateFuelStatus()
      });
      
      // Send salary notification
      const notification = createSalaryNotification(amount);
      useNotificationStore.getState().addNotification(notification);
      
      // Check achievements
      AchievementService.checkEmergencyFund();
      AchievementService.runAchievementChecks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set salary';
      set({ error: errorMessage });
      console.error('Set salary error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Expense Management
  addExpense: async (expenseInput: ExpenseInput) => {
    set({ isLoading: true, error: null });
    try {
      const expense: Expense = {
        id: generateId(),
        amount: expenseInput.amount,
        category: expenseInput.category,
        description: expenseInput.description,
        date: expenseInput.date || new Date(),
        source: expenseInput.source || 'manual',
        tags: expenseInput.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({
        expenses: [...state.expenses, expense]
      }));
      
      // Send big spend alert if needed
      const { currentBalance, daysRemaining } = get();
      const previousDays = daysRemaining;
      
      // Recalculate derived values
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        averageDailySpend: get().calculateAverageDailySpend(),
        fuelStatus: get().calculateFuelStatus()
      });
      
      // Check if this is a big spend (more than 10% of current balance)
      if (expense.amount > currentBalance * 0.1) {
        const newDays = get().calculateDaysRemaining();
        const notification = createBigSpendNotification(
          expense.amount,
          expense.category,
          previousDays,
          newDays
        );
        useNotificationStore.getState().addNotification(notification);
      }
      
      // Send notification through NotificationService
      NotificationService.generateBigSpendAlert(expense.amount, expense.description);
      
      // Check achievements
      AchievementService.checkExpenseLogger();
      AchievementService.runAchievementChecks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      set({ error: errorMessage });
      console.error('Add expense error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateExpense: async (id: string, updates: Partial<Expense>) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        expenses: state.expenses.map(expense => 
          expense.id === id 
            ? { ...expense, ...updates, updatedAt: new Date() }
            : expense
        )
      }));
      
      // Recalculate derived values
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        averageDailySpend: get().calculateAverageDailySpend(),
        fuelStatus: get().calculateFuelStatus()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update expense';
      set({ error: errorMessage });
      console.error('Update expense error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteExpense: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        expenses: state.expenses.filter(expense => expense.id !== id)
      }));
      
      // Recalculate derived values
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        averageDailySpend: get().calculateAverageDailySpend(),
        fuelStatus: get().calculateFuelStatus()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense';
      set({ error: errorMessage });
      console.error('Delete expense error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Recurring Bills Management
  addRecurringBill: async (billInput: RecurringBillInput) => {
    set({ isLoading: true, error: null });
    try {
      const bill: RecurringBill = {
        id: generateId(),
        name: billInput.name,
        amount: billInput.amount,
        frequency: billInput.frequency,
        nextDueDate: billInput.nextDueDate,
        category: billInput.category,
        autoDeduct: billInput.autoDeduct || false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({
        recurringBills: [...state.recurringBills, bill]
      }));
      
      // Recalculate if auto-deduct is enabled
      if (bill.autoDeduct) {
        set({
          currentBalance: get().calculateBalance(),
          daysRemaining: get().calculateDaysRemaining(),
          fuelStatus: get().calculateFuelStatus()
        });
      }
      
      // Check achievements
      AchievementService.checkBillTracker();
      AchievementService.runAchievementChecks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recurring bill';
      set({ error: errorMessage });
      console.error('Add recurring bill error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateRecurringBill: async (id: string, updates: Partial<RecurringBill>) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        recurringBills: state.recurringBills.map(bill => 
          bill.id === id 
            ? { ...bill, ...updates, updatedAt: new Date() }
            : bill
        )
      }));
      
      // Recalculate if auto-deduct changed
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        fuelStatus: get().calculateFuelStatus()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update recurring bill';
      set({ error: errorMessage });
      console.error('Update recurring bill error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteRecurringBill: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        recurringBills: state.recurringBills.filter(bill => bill.id !== id)
      }));
      
      // Recalculate derived values
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        fuelStatus: get().calculateFuelStatus()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recurring bill';
      set({ error: errorMessage });
      console.error('Delete recurring bill error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Calculations
  calculateBalance: () => {
    const state = get();
    if (!state.salary) return 0;
    
    const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const recurringBillsTotal = state.recurringBills
      .filter(bill => bill.isActive && bill.autoDeduct)
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    return Math.max(0, state.salary.amount - totalExpenses - recurringBillsTotal);
  },
  
  calculateDaysRemaining: () => {
    const state = get();
    const balance = get().calculateBalance();
    const avgDailySpend = get().calculateAverageDailySpend();
    
    if (avgDailySpend === 0) return balance > 0 ? 999 : 0;
    return Math.floor(balance / avgDailySpend);
  },
  
  calculateAverageDailySpend: () => {
    const state = get();
    if (state.expenses.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentExpenses = state.expenses.filter(
      expense => expense.date >= thirtyDaysAgo && expense.source !== 'recurring'
    );
    
    if (recentExpenses.length === 0) return 0;
    
    const totalAmount = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
    
    return totalAmount / daysDiff;
  },
  
  calculateFuelStatus: (): FuelStatus => {
    const state = get();
    if (!state.salary) {
      return {
        level: FuelLevel.EMPTY,
        percentage: 0,
        daysRemaining: 0,
        color: getFuelColor(FuelLevel.EMPTY),
        warningMessage: 'Please set your salary first'
      };
    }
    
    const balance = get().calculateBalance();
    const percentage = Math.max(0, Math.min(100, (balance / state.salary.amount) * 100));
    const level = getFuelLevel(percentage);
    const daysRemaining = get().calculateDaysRemaining();
    
    let warningMessage: string | undefined;
    
    if (level === FuelLevel.EMPTY) {
      warningMessage = '🚨 Emergency! Refuel immediately!';
    } else if (level === FuelLevel.CRITICAL) {
      warningMessage = '⚠️ Critical fuel level! Take action soon.';
    } else if (level === FuelLevel.LOW) {
      warningMessage = '🔥 Low fuel warning! Plan your expenses carefully.';
    }
    
    // Send fuel notifications when fuel status changes
    const previousFuelStatus = state.fuelStatus;
    if (previousFuelStatus.level !== level) {
      NotificationService.generateFuelNotifications();
    }
    
    return {
      level,
      percentage: Math.round(percentage),
      daysRemaining,
      color: getFuelColor(level),
      warningMessage
    };
  },
  
  getSpendingAnalytics: (): SpendingAnalytics => {
    const state = get();
    const expenses = state.expenses.filter(expense => expense.source !== 'recurring');
    
    if (expenses.length === 0) {
      return {
        averageDailySpend: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        projectedBurnRate: 0,
        savingsStreak: 0,
        budgetAdherence: 1,
        topCategories: []
      };
    }
    
    // Category breakdown
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    expenses.forEach(expense => {
      const category = expense.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 };
      }
      categoryTotals[category].amount += expense.amount;
      categoryTotals[category].count += 1;
    });
    
    const totalExpenses = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
    const categoryBreakdown: CategorySpending[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Monthly trend (last 6 months)
    const monthlyTrend: MonthlySpending[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthExpenses = expenses.filter(expense => 
        expense.date >= date && expense.date < nextMonth
      );
      
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        amount: monthTotal
      });
    }
    
    return {
      averageDailySpend: get().calculateAverageDailySpend(),
      categoryBreakdown,
      monthlyTrend,
      projectedBurnRate: get().calculateAverageDailySpend() * 30, // Monthly projection
      savingsStreak: 0, // TODO: Calculate based on savings history
      budgetAdherence: state.salary ? Math.min(1, get().calculateBalance() / (state.salary.amount * 0.1)) : 0,
      topCategories: categoryBreakdown.slice(0, 3).map(cat => cat.category)
    };
  },
  
  getFinancialContext: (): FinancialContext => {
    const state = get();
    const analytics = get().getSpendingAnalytics();
    
    return {
      balance: get().calculateBalance(),
      daysLeft: get().calculateDaysRemaining(),
      salary: state.salary?.amount || 0,
      avgDailySpend: analytics.averageDailySpend,
      topCategories: analytics.topCategories,
      totalExpenses: state.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      recurringBillsAmount: state.recurringBills
        .filter(bill => bill.isActive)
        .reduce((sum, bill) => sum + bill.amount, 0)
    };
  },
  
  // Utility Actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      set({
        currentBalance: get().calculateBalance(),
        daysRemaining: get().calculateDaysRemaining(),
        averageDailySpend: get().calculateAverageDailySpend(),
        fuelStatus: get().calculateFuelStatus()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      set({ error: errorMessage });
      console.error('Refresh data error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  resetApp: () => {
    set(initialState);
  }
}), appStorePersistConfig));