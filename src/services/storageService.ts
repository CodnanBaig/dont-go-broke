import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserProfile, 
  SalaryData, 
  Expense, 
  RecurringBill, 
  AppNotification, 
  NotificationSettings,
  Suggestion
} from '@/types';
import { STORAGE_KEYS } from '@/stores/persistence';

export class StorageService {
  private static instance: StorageService;
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  // Generic storage operations
  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }
  
  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }
  
  private async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }
  
  // User Profile operations
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PREFERENCES, profile);
  }
  
  async loadUserProfile(): Promise<UserProfile | null> {
    return await this.getItem<UserProfile>(STORAGE_KEYS.USER_PREFERENCES);
  }
  
  async clearUserProfile(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  }
  
  // Salary operations
  async saveSalaryData(salary: SalaryData): Promise<void> {
    const key = `${STORAGE_KEYS.APP_STORE}_salary`;
    await this.setItem(key, salary);
  }
  
  async loadSalaryData(): Promise<SalaryData | null> {
    const key = `${STORAGE_KEYS.APP_STORE}_salary`;
    return await this.getItem<SalaryData>(key);
  }
  
  // Expenses operations
  async saveExpenses(expenses: Expense[]): Promise<void> {
    const key = `${STORAGE_KEYS.APP_STORE}_expenses`;
    await this.setItem(key, expenses);
  }
  
  async loadExpenses(): Promise<Expense[]> {
    const key = `${STORAGE_KEYS.APP_STORE}_expenses`;
    const expenses = await this.getItem<Expense[]>(key);
    return expenses || [];
  }
  
  async addExpense(expense: Expense): Promise<void> {
    const expenses = await this.loadExpenses();
    expenses.push(expense);
    await this.saveExpenses(expenses);
  }
  
  async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    const expenses = await this.loadExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates, updatedAt: new Date() };
      await this.saveExpenses(expenses);
    }
  }
  
  async deleteExpense(id: string): Promise<void> {
    const expenses = await this.loadExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    await this.saveExpenses(filteredExpenses);
  }
  
  // Recurring Bills operations
  async saveRecurringBills(bills: RecurringBill[]): Promise<void> {
    const key = `${STORAGE_KEYS.APP_STORE}_recurringBills`;
    await this.setItem(key, bills);
  }
  
  async loadRecurringBills(): Promise<RecurringBill[]> {
    const key = `${STORAGE_KEYS.APP_STORE}_recurringBills`;
    const bills = await this.getItem<RecurringBill[]>(key);
    return bills || [];
  }
  
  async addRecurringBill(bill: RecurringBill): Promise<void> {
    const bills = await this.loadRecurringBills();
    bills.push(bill);
    await this.saveRecurringBills(bills);
  }
  
  async updateRecurringBill(id: string, updates: Partial<RecurringBill>): Promise<void> {
    const bills = await this.loadRecurringBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...updates, updatedAt: new Date() };
      await this.saveRecurringBills(bills);
    }
  }
  
  async deleteRecurringBill(id: string): Promise<void> {
    const bills = await this.loadRecurringBills();
    const filteredBills = bills.filter(b => b.id !== id);
    await this.saveRecurringBills(filteredBills);
  }
  
  // Notifications operations
  async saveNotifications(notifications: AppNotification[]): Promise<void> {
    const key = `${STORAGE_KEYS.NOTIFICATION_STORE}_notifications`;
    await this.setItem(key, notifications);
  }
  
  async loadNotifications(): Promise<AppNotification[]> {
    const key = `${STORAGE_KEYS.NOTIFICATION_STORE}_notifications`;
    const notifications = await this.getItem<AppNotification[]>(key);
    return notifications || [];
  }
  
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    const key = `${STORAGE_KEYS.NOTIFICATION_STORE}_settings`;
    await this.setItem(key, settings);
  }
  
  async loadNotificationSettings(): Promise<NotificationSettings | null> {
    const key = `${STORAGE_KEYS.NOTIFICATION_STORE}_settings`;
    return await this.getItem<NotificationSettings>(key);
  }
  
  // Suggestions operations
  async saveSuggestionsHistory(suggestions: Suggestion[]): Promise<void> {
    const key = `${STORAGE_KEYS.SUGGESTIONS_STORE}_history`;
    await this.setItem(key, suggestions);
  }
  
  async loadSuggestionsHistory(): Promise<Suggestion[]> {
    const key = `${STORAGE_KEYS.SUGGESTIONS_STORE}_history`;
    const suggestions = await this.getItem<Suggestion[]>(key);
    return suggestions || [];
  }
  
  // Backup and restore operations
  async exportAllData(): Promise<{
    userProfile: UserProfile | null;
    salary: SalaryData | null;
    expenses: Expense[];
    recurringBills: RecurringBill[];
    notifications: AppNotification[];
    notificationSettings: NotificationSettings | null;
    suggestionsHistory: Suggestion[];
    exportDate: string;
  }> {
    return {
      userProfile: await this.loadUserProfile(),
      salary: await this.loadSalaryData(),
      expenses: await this.loadExpenses(),
      recurringBills: await this.loadRecurringBills(),
      notifications: await this.loadNotifications(),
      notificationSettings: await this.loadNotificationSettings(),
      suggestionsHistory: await this.loadSuggestionsHistory(),
      exportDate: new Date().toISOString()
    };
  }
  
  async importAllData(data: {
    userProfile?: UserProfile;
    salary?: SalaryData;
    expenses?: Expense[];
    recurringBills?: RecurringBill[];
    notifications?: AppNotification[];
    notificationSettings?: NotificationSettings;
    suggestionsHistory?: Suggestion[];
  }): Promise<void> {
    try {
      if (data.userProfile) {
        await this.saveUserProfile(data.userProfile);
      }
      if (data.salary) {
        await this.saveSalaryData(data.salary);
      }
      if (data.expenses) {
        await this.saveExpenses(data.expenses);
      }
      if (data.recurringBills) {
        await this.saveRecurringBills(data.recurringBills);
      }
      if (data.notifications) {
        await this.saveNotifications(data.notifications);
      }
      if (data.notificationSettings) {
        await this.saveNotificationSettings(data.notificationSettings);
      }
      if (data.suggestionsHistory) {
        await this.saveSuggestionsHistory(data.suggestionsHistory);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }
  
  // Utility operations
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      
      // Also clear individual keys
      const additionalKeys = [
        `${STORAGE_KEYS.APP_STORE}_salary`,
        `${STORAGE_KEYS.APP_STORE}_expenses`,
        `${STORAGE_KEYS.APP_STORE}_recurringBills`,
        `${STORAGE_KEYS.NOTIFICATION_STORE}_notifications`,
        `${STORAGE_KEYS.NOTIFICATION_STORE}_settings`,
        `${STORAGE_KEYS.SUGGESTIONS_STORE}_history`
      ];
      
      await AsyncStorage.multiRemove(additionalKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all data');
    }
  }
  
  async getStorageInfo(): Promise<{
    totalKeys: number;
    totalSize: number;
    keyDetails: { key: string; size: number }[];
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        key.startsWith('@fuel-tracker/')
      );
      
      let totalSize = 0;
      const keyDetails: { key: string; size: number }[] = [];
      
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        totalSize += size;
        keyDetails.push({ key, size });
      }
      
      return {
        totalKeys: appKeys.length,
        totalSize,
        keyDetails: keyDetails.sort((a, b) => b.size - a.size)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalKeys: 0,
        totalSize: 0,
        keyDetails: []
      };
    }
  }
  
  async hasExistingData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.some(key => key.startsWith('@fuel-tracker/'));
    } catch (error) {
      console.error('Error checking for existing data:', error);
      return false;
    }
  }
  
  // Data validation
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Validate user profile
      const userProfile = await this.loadUserProfile();
      if (userProfile && (!userProfile.id || !userProfile.currency)) {
        errors.push('Invalid user profile data');
      }
      
      // Validate expenses
      const expenses = await this.loadExpenses();
      expenses.forEach((expense, index) => {
        if (!expense.id || !expense.amount || !expense.category) {
          errors.push(`Invalid expense at index ${index}`);
        }
      });
      
      // Validate recurring bills
      const bills = await this.loadRecurringBills();
      bills.forEach((bill, index) => {
        if (!bill.id || !bill.name || !bill.amount) {
          errors.push(`Invalid recurring bill at index ${index}`);
        }
      });
      
    } catch (error) {
      errors.push('Failed to validate data integrity');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export default StorageService.getInstance();